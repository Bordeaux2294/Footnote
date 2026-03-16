"""
Synchronous claim-check endpoint.

Receives a sentence, detects if it's a claim, and if so generates a verdict
with supporting/contradicting sources from a curated set of climate-change papers.
No Celery, Redis, or pgvector required — just Groq API calls.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from ..services import detect_claim, generate_verdict_simple

CLIMATE_PAPERS = [
    {
        "id": 1,
        "title": "Global Warming of 1.5°C",
        "authors": ["IPCC"],
        "year": 2018,
        "url": "https://www.ipcc.ch/sr15/",
        "abstract": (
            "Human activities are estimated to have caused approximately 1.0°C of global "
            "warming above pre-industrial levels. Global warming is likely to reach 1.5°C "
            "between 2030 and 2052 if it continues to increase at the current rate. "
            "Climate-related risks for natural and human systems are higher for global "
            "warming of 1.5°C than at present, but lower than at 2°C. Limiting global "
            "warming to 1.5°C would require rapid, far-reaching and unprecedented changes "
            "in all aspects of society. Under emissions pathways consistent with 1.5°C, "
            "global net human-caused CO2 emissions would need to decline by about 45% from "
            "2010 levels by 2030, reaching net zero around 2050."
        ),
    },
    {
        "id": 2,
        "title": "Climate Change 2021: The Physical Science Basis (AR6 WG1)",
        "authors": ["IPCC"],
        "year": 2021,
        "url": "https://www.ipcc.ch/report/ar6/wg1/",
        "abstract": (
            "It is unequivocal that human influence has warmed the atmosphere, ocean and "
            "land. Each of the last four decades has been successively warmer than any "
            "decade that preceded it since 1850. Global surface temperature has increased "
            "faster since 1970 than in any other 50-year period over at least the last "
            "2000 years. Global mean sea level increased by 0.20 m between 1901 and 2018. "
            "The average rate of sea level rise was 1.3 mm/yr between 1901 and 1971, "
            "increasing to 3.7 mm/yr between 2006 and 2018. Human influence is very likely "
            "the main driver of the global retreat of glaciers since the 1990s and the "
            "decrease in Arctic sea ice area."
        ),
    },
    {
        "id": 3,
        "title": "Quantifying the consensus on anthropogenic global warming in the scientific literature",
        "authors": ["Cook, J.", "Nuccitelli, D.", "Green, S.A.", "Richardson, M.", "Winkler, B."],
        "year": 2013,
        "url": "https://doi.org/10.1088/1748-9326/8/2/024024",
        "abstract": (
            "We analyze the evolution of the scientific consensus on anthropogenic global "
            "warming in the peer-reviewed scientific literature, examining 11,944 climate "
            "abstracts from 1991-2011 matching the topics 'global climate change' or "
            "'global warming'. Among abstracts expressing a position on AGW, 97.1% endorsed "
            "the consensus position that humans are causing global warming. Among scientists "
            "who expressed a position on AGW in their abstracts, 97.2% endorsed the consensus. "
            "The number of papers rejecting the consensus on AGW is a vanishingly small "
            "proportion of the published research."
        ),
    },
    {
        "id": 4,
        "title": "Contribution of Working Group III to the Sixth Assessment Report — Mitigation of Climate Change",
        "authors": ["IPCC"],
        "year": 2022,
        "url": "https://www.ipcc.ch/report/ar6/wg3/",
        "abstract": (
            "Total net anthropogenic greenhouse gas emissions have continued to rise during "
            "2010-2019, as have cumulative net CO2 emissions since 1850. Average annual GHG "
            "emissions during 2010-2019 were higher than in any previous decade, but the "
            "rate of growth between 2010 and 2019 was lower than between 2000 and 2009. "
            "Without a strengthening of policies, GHG emissions are projected to rise beyond "
            "2025, leading to a median global warming of 3.2°C by 2100. Limiting warming to "
            "2°C or 1.5°C requires global GHG emissions to peak before 2025. Rapid and deep "
            "reductions in CO2 and other greenhouse gas emissions are necessary in all sectors "
            "to limit warming. Renewable energy costs have dropped significantly — solar energy "
            "costs decreased by 85% and wind energy by 55% between 2010 and 2019."
        ),
    },
    {
        "id": 5,
        "title": "Global Carbon Budget 2023",
        "authors": ["Friedlingstein, P.", "O'Sullivan, M.", "Jones, M.W.", "Andrew, R.M.", "Hauck, J."],
        "year": 2023,
        "url": "https://doi.org/10.5194/essd-15-5301-2023",
        "abstract": (
            "Global fossil CO2 emissions reached 36.8 Gt CO2 in 2023, a record high and "
            "1.1% above 2022 levels. Total anthropogenic CO2 emissions including land-use "
            "change were 40.9 Gt CO2 in 2023. The atmospheric CO2 concentration reached "
            "419.3 ppm averaged over 2023. The ocean CO2 sink was 10.6 Gt CO2 and the land "
            "CO2 sink was 10.4 Gt CO2 in 2023. The remaining carbon budget for a 50% chance "
            "of limiting warming to 1.5°C is approximately 275 Gt CO2 from the start of 2023, "
            "equivalent to about 7 years at 2023 emission levels. Global CO2 emissions from "
            "coal, oil, and gas were 15.5, 12.1, and 7.9 Gt CO2 respectively in 2023."
        ),
    },
]


class CheckSentenceView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        text = request.data.get("text", "").strip()
        sentence_id = request.data.get("sentenceId")

        if not text:
            return Response(
                {"error": "text is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Step 1: detect whether it's a claim
        detection = detect_claim(text)
        is_claim = detection.get("is_claim", False) and detection.get("confidence", 0) > 0.6

        if not is_claim:
            return Response({
                "sentenceId": sentence_id,
                "is_claim": False,
            })

        # Step 2: generate verdict against climate-change papers
        verdict_data = generate_verdict_simple(text, CLIMATE_PAPERS)

        return Response({
            "sentenceId": sentence_id,
            "is_claim": True,
            "verdict": verdict_data.get("verdict", "inconclusive"),
            "confidence": verdict_data.get("confidence_score", 0.0),
            "summary": verdict_data.get("summary", ""),
            "sources": verdict_data.get("sources", []),
        })
