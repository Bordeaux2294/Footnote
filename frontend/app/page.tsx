"use client";

declare global { interface Window { google?: any; } }

import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";

const AppCtx = createContext<any>(null);
const useApp = () => useContext(AppCtx);

const SP = [
  { id:1, name:"Speaker 1", color:"#6C63FF", bg:"rgba(108,99,255,0.12)", initial:"1" },
  { id:2, name:"Speaker 2", color:"#00D2FF", bg:"rgba(0,210,255,0.12)", initial:"2" },
  { id:3, name:"Speaker 3", color:"#FF6B9D", bg:"rgba(255,107,157,0.12)", initial:"3" },
];
const CATS = ["Statistical","Factual","Opinion","Projection","Historical"];
const DEMO = [
  { speaker:0, text:"Good morning everyone. Let's begin with the quarterly review.", isClaim:false },
  { speaker:1, text:"Thanks. Our revenue grew by 34% year-over-year, well ahead of projections.", isClaim:true, claimCategory:"Statistical", confidence:92, context:"Revenue growth of 34% YoY is a verifiable financial metric. Industry average SaaS growth for 2025 was ~22%, making this significantly above average." },
  { speaker:0, text:"That's encouraging. Can you break that down by segment?", isClaim:false },
  { speaker:1, text:"Enterprise accounts drove about 60% of new revenue. Self-serve contributed 40%, a shift from last quarter.", isClaim:true, claimCategory:"Statistical", confidence:85, context:"Revenue segmentation of 60/40 enterprise vs self-serve represents a shift from the previous quarter's roughly 50/50 split." },
  { speaker:2, text:"We should be careful. Historically Q1 has always been our weakest quarter for enterprise deals.", isClaim:true, claimCategory:"Historical", confidence:78, context:"The assertion about Q1 weakness aligns with common B2B sales cycles where budgets often reset early in the year." },
  { speaker:0, text:"Good point. What's retention looking like?", isClaim:false },
  { speaker:1, text:"Net revenue retention is 118%, highest in two years. Churn dropped to 2.1% this quarter.", isClaim:true, claimCategory:"Statistical", confidence:94, context:"NRR of 118% places the company in the top quartile of SaaS. Churn of 2.1% is well below the 5-7% industry median." },
  { speaker:2, text:"The September product improvements are the main driver. The new onboarding flow cut time-to-value by half.", isClaim:true, claimCategory:"Factual", confidence:71, context:"Attributing retention to specific product changes may oversimplify. The 50% time-to-value reduction needs verification against onboarding analytics." },
  { speaker:0, text:"Let's discuss the roadmap. Priorities for next quarter?", isClaim:false },
  { speaker:1, text:"We're launching the AI analytics module. Internal testing shows 70% faster report generation.", isClaim:true, claimCategory:"Projection", confidence:68, context:"The 70% improvement is from internal testing and may not reflect real-world usage. Projected gains often decrease at scale." },
  { speaker:2, text:"This will be our most significant launch since the 2023 platform rewrite. The AI analytics market should reach $40 billion by 2027.", isClaim:true, claimCategory:"Opinion", confidence:55, context:"Comparison to 2023 rewrite is subjective. Market projections vary from $28B to $52B depending on scope." },
  { speaker:0, text:"Great discussion. Let's schedule follow-ups with each team lead. Thanks everyone.", isClaim:false },
];
const SAVED_SESSIONS = [
  { id:1, title:"Q4 Strategy Meeting", date:"Mar 10, 2026", duration:"24:35", speakers:3, claims:8, segments:DEMO.map((s,i)=>({...s,timestamp:`${String(Math.floor(i*2/60)).padStart(2,"0")}:${String((i*12)%60).padStart(2,"0")}`})) },
  { id:2, title:"Product Roadmap Review", date:"Mar 7, 2026", duration:"18:12", speakers:2, claims:5, segments:[] },
  { id:3, title:"Investor Update Call", date:"Mar 3, 2026", duration:"32:08", speakers:4, claims:12, segments:[] },
  { id:4, title:"Engineering Standup", date:"Feb 28, 2026", duration:"11:45", speakers:3, claims:3, segments:[] },
];
const SAVED_PAPERS = [
  { id:1, title:"The Impact of AI on Modern Healthcare Systems", date:"Mar 11, 2026", claims:14, status:"Verified" },
  { id:2, title:"Climate Change Policy Brief 2026", date:"Mar 8, 2026", claims:23, status:"In Progress" },
  { id:3, title:"Quarterly Financial Analysis Report", date:"Mar 5, 2026", claims:9, status:"Verified" },
  { id:4, title:"Neural Network Architecture Comparisons", date:"Mar 1, 2026", claims:18, status:"Pending" },
];

const Badge = ({children,color="#FFD666",bg=undefined}) =><span style={{padding:"3px 10px",borderRadius:6,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",background:bg||`${color}22`,color}}>{children}</span>;
const Btn = ({children,primary,small,style,...p}:{[k:string]:any}) =><button {...p} style={{padding:small?"6px 14px":"10px 22px",borderRadius:small?8:12,border:"none",cursor:"pointer",fontSize:small?12:14,fontWeight:600,background:primary?"linear-gradient(135deg,#6C63FF,#00D2FF)":"rgba(255,255,255,0.06)",color:primary?"#fff":"#ccc",transition:"all 0.2s",...style}}>{children}</button>;
const Card = ({children,style,onClick}) => <div onClick={onClick} style={{padding:20,borderRadius:16,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",cursor:onClick?"pointer":"default",transition:"all 0.25s",...style}}>{children}</div>;
const Input = ({label,type="text",...p}) => <div style={{display:"flex",flexDirection:"column",gap:6}}>{label&&<label style={{fontSize:12,fontWeight:600,color:"#888"}}>{label}</label>}<input type={type} {...p} style={{padding:"10px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"#E8E8F0",fontSize:14,outline:"none",...(p.style||{})}}/></div>;
const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

const WaveBar = ({active}) => {
  const [h,setH]=useState(Array(20).fill(4));
  useEffect(()=>{if(!active){setH(Array(20).fill(4));return;}const i=setInterval(()=>setH(Array(20).fill(0).map(()=>Math.random()*28+4)),120);return()=>clearInterval(i);},[active]);
  return <div style={{display:"flex",gap:2,alignItems:"center",height:32}}>{h.map((v,i)=><div key={i} style={{width:3,height:v,borderRadius:2,background:"linear-gradient(to top,#6C63FF,#00D2FF)",transition:"height 0.12s",opacity:active?.8:.2}}/>)}</div>;
};
const Pulse = ({color,size=10}) => {
  const [p,setP]=useState(false);
  useEffect(()=>{const i=setInterval(()=>setP(v=>!v),1500);return()=>clearInterval(i);},[]);
  return <div style={{position:"relative",width:size,height:size}}><div style={{position:"absolute",inset:0,borderRadius:"50%",background:color,opacity:.9}}/><div style={{position:"absolute",inset:-3,borderRadius:"50%",border:`2px solid ${color}`,opacity:p?0:.6,transform:p?"scale(1.8)":"scale(1)",transition:"all 1.5s ease-out"}}/></div>;
};

// ── Claim Card Stack ──
function ClaimCardStack({ claims, open, onClose }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const stackRef = useRef(null);

  useEffect(() => { if (claims.length > 0) setActiveIdx(claims.length - 1); }, [claims.length]);

  const goTo = (i) => setActiveIdx(Math.max(0, Math.min(claims.length - 1, i)));

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (e.deltaY > 0) goTo(activeIdx - 1);
    else goTo(activeIdx + 1);
  }, [activeIdx, claims.length]);

  useEffect(() => {
    const el = stackRef.current;
    if (!el || !open) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel, open]);

  if (!claims.length) return (
    <div style={{width:open?400:0,transition:"width 0.4s cubic-bezier(0.16,1,0.3,1)",overflow:"hidden",borderLeft:open?"1px solid rgba(255,255,255,0.06)":"none",flexShrink:0}}>
      <div style={{width:400,height:"100%",background:"rgba(12,12,22,0.98)",display:"flex",alignItems:"center",justifyContent:"center",padding:40}}>
        <p style={{color:"#555",fontSize:14,textAlign:"center"}}>Claims will appear here as they're detected.</p>
      </div>
    </div>
  );


  return (
    <div style={{width:open?400:0,transition:"width 0.4s cubic-bezier(0.16,1,0.3,1)",overflow:"hidden",borderLeft:open?"1px solid rgba(255,255,255,0.06)":"none",flexShrink:0}}>
      <div style={{width:400,height:"100%",display:"flex",flexDirection:"column",background:"rgba(12,12,22,0.98)",backdropFilter:"blur(24px)"}}>
        {/* Header */}
        <div style={{padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid rgba(255,255,255,0.06)",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"#FFD666",boxShadow:"0 0 12px rgba(255,214,102,0.5)"}}/>
            <span style={{fontSize:14,fontWeight:700}}>Claim Stack</span>
            <span style={{fontSize:12,color:"#666",marginLeft:4}}>{claims.length} total</span>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.06)",border:"none",color:"#888",width:28,height:28,borderRadius:8,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>

        {/* Card Stack Area */}
        <div ref={stackRef} style={{flex:1,position:"relative",overflow:"hidden",padding:"24px 20px 16px"}}>
          {/* Stacked cards behind */}
          {claims.map((c, i) => {
            const dist = i - activeIdx;
            const absDist = Math.abs(dist);
            if (absDist > 4) return null;
            const isActive = i === activeIdx;
            return (
              <div key={i} onClick={() => setActiveIdx(i)} style={{
                position: "absolute", left: 20, right: 20, top: 24,
                borderRadius: 18,
                background: isActive ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                border: isActive ? "1px solid rgba(255,214,102,0.2)" : "1px solid rgba(255,255,255,0.05)",
                backdropFilter: "blur(16px)",
                transform: `translateY(${dist * -12}px) scale(${1 - absDist * 0.03})`,
                opacity: isActive ? 1 : Math.max(0, 0.7 - absDist * 0.2),
                zIndex: claims.length - absDist,
                transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
                cursor: isActive ? "default" : "pointer",
                pointerEvents: absDist > 2 ? "none" : "auto",
                boxShadow: isActive ? "0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,214,102,0.08)" : "0 4px 20px rgba(0,0,0,0.3)",
                padding: 0,
                overflow: "hidden",
                height: isActive ? "auto" : "calc(100% - 20px)",
                maxHeight: "calc(100% - 20px)",
              }}>
                {isActive ? (
                  <div style={{padding:20,display:"flex",flexDirection:"column",gap:14,animation:"cardIn 0.35s ease",maxHeight:"100%",overflowY:"auto"}}>
                    {/* Claim number + source badge */}
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:28,height:28,borderRadius:8,background:"rgba(255,214,102,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#FFD666",flexShrink:0}}>#{i+1}</div>
                      {c.claimData?.savedPaper && <Badge color="#00D2FF">{c.claimData.savedPaper}</Badge>}
                    </div>

                    {/* Claim Text */}
                    <div style={{padding:14,borderRadius:12,background:"rgba(255,214,102,0.05)",borderLeft:"3px solid #FFD666"}}>
                      <p style={{fontSize:13.5,lineHeight:1.65,color:"#E8E8F0",margin:0}}>"{c.text}"</p>
                      <div style={{marginTop:10,display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:18,height:18,borderRadius:5,background:`linear-gradient(135deg,${SP[c.speaker]?.color||"#6C63FF"},${SP[c.speaker]?.color||"#6C63FF"}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700}}>{SP[c.speaker]?.initial||"?"}</div>
                        <span style={{fontSize:11,color:SP[c.speaker]?.color||"#6C63FF",fontWeight:600}}>{SP[c.speaker]?.name||"Speaker"}</span>
                        {c.timestamp&&<span style={{fontSize:10,color:"#555",fontFamily:"monospace"}}>{c.timestamp}</span>}
                      </div>
                    </div>

                    {/* Verdict badge */}
                    {c.claimData?.verdict && (
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <Badge color={c.claimData.verdict==="supported"?"#4ADE80":c.claimData.verdict==="contradicted"?"#FF6B6B":c.claimData.verdict==="misleading"?"#FF9F43":"#888"} bg={c.claimData.verdict==="supported"?"rgba(74,222,128,0.12)":c.claimData.verdict==="contradicted"?"rgba(255,107,107,0.12)":c.claimData.verdict==="misleading"?"rgba(255,159,67,0.12)":"rgba(136,136,136,0.12)"}>
                          {c.claimData.verdict}
                        </Badge>
                        {c.claimData.confidence != null && (
                          <span style={{fontSize:11,color:"#666"}}>{Math.round(c.claimData.confidence * 100)}% confidence</span>
                        )}
                      </div>
                    )}

                    {/* Summary */}
                    {c.claimData?.summary && (
                      <div>
                        <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#666",marginBottom:8}}>Summary</div>
                        <p style={{fontSize:12.5,lineHeight:1.7,color:"#999",margin:0}}>{c.claimData.summary}</p>
                      </div>
                    )}

                    {/* Sources */}
                    {c.claimData?.sources && c.claimData.sources.length > 0 && (
                      <div>
                        <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#666",marginBottom:8}}>Scholarly Sources</div>
                        <div style={{display:"flex",flexDirection:"column",gap:8}}>
                          {c.claimData.sources.map((src: any, si: number) => (
                            <div key={si} style={{padding:10,borderRadius:10,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)"}}>
                              <div style={{display:"flex",alignItems:"flex-start",gap:6,marginBottom:4}}>
                                <div style={{width:6,height:6,borderRadius:"50%",background:src.supports?"#4ADE80":"#FF6B6B",marginTop:5,flexShrink:0}}/>
                                <span style={{fontSize:12,fontWeight:600,color:"#ccc",lineHeight:1.4}}>{src.title}</span>
                              </div>
                              {src.authors && <p style={{fontSize:10,color:"#666",margin:"0 0 2px 12px"}}>{Array.isArray(src.authors)?src.authors.join(", "):src.authors} {src.year ? `(${src.year})` : ""}</p>}
                              {src.excerpt && <p style={{fontSize:11,color:"#888",margin:"4px 0 0 12px",lineHeight:1.5,fontStyle:"italic"}}>"{src.excerpt}"</p>}
                              {src.url && (
                                <a href={src.url} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"#00D2FF",textDecoration:"none",display:"flex",alignItems:"center",gap:4,marginTop:6,marginLeft:12}}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                  View Paper
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{padding:16,opacity:0.7}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                      <div style={{width:22,height:22,borderRadius:6,background:"rgba(255,214,102,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#FFD666",flexShrink:0}}>#{i+1}</div>
                      {c.claimData?.verdict && <Badge color={c.claimData.verdict==="supported"?"#4ADE80":c.claimData.verdict==="contradicted"?"#FF6B6B":"#888"}>{c.claimData.verdict}</Badge>}
                    </div>
                    <p style={{fontSize:12,lineHeight:1.5,color:"#aaa",margin:0,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>"{c.text}"</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation dots */}
        <div style={{padding:"12px 20px 16px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,flexShrink:0}}>
          <button onClick={()=>goTo(activeIdx-1)} disabled={activeIdx===0} style={{width:28,height:28,borderRadius:8,border:"none",cursor:activeIdx===0?"default":"pointer",background:"rgba(255,255,255,0.06)",color:activeIdx===0?"#333":"#999",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,opacity:activeIdx===0?.4:1}}>‹</button>
          <div style={{display:"flex",gap:4,alignItems:"center"}}>
            {claims.map((_, i) => (
              <div key={i} onClick={() => setActiveIdx(i)} style={{
                width: i === activeIdx ? 20 : 6, height: 6, borderRadius: 3,
                background: i === activeIdx ? "#FFD666" : "rgba(255,255,255,0.12)",
                cursor: "pointer", transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
              }}/>
            ))}
          </div>
          <button onClick={()=>goTo(activeIdx+1)} disabled={activeIdx===claims.length-1} style={{width:28,height:28,borderRadius:8,border:"none",cursor:activeIdx===claims.length-1?"default":"pointer",background:"rgba(255,255,255,0.06)",color:activeIdx===claims.length-1?"#333":"#999",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,opacity:activeIdx===claims.length-1?.4:1}}>›</button>
        </div>
      </div>
    </div>
  );
}

// ── Pages ──
function LandingPage() {
  const {setPage}=useApp();
  const [glow,setGlow]=useState(false);
  const [visibleFeatures,setVisibleFeatures]=useState<number[]>([]);

  const FEATURES = [
    {num:"01",icon:"\uD83C\uDF99\uFE0F",title:"Multi-speaker transcription",desc:"Each voice is identified and labeled in real time. No post-processing. No waiting.",color:"#6C63FF"},
    {num:"02",icon:"\uD83D\uDD0D",title:"Live claim detection",desc:"Claims are automatically flagged as they\u2019re spoken, with source context surfaced instantly.",color:"#00D2FF"},
    {num:"03",icon:"\uD83D\uDC65",title:"Audience sync",desc:"Everyone in the room follows along on their device. The transcript updates live for all connected viewers.",color:"#4ADE80"},
    {num:"04",icon:"\uD83D\uDCCA",title:"Speaker analytics",desc:"See who spoke most, which claims were contested, and a full breakdown after the session ends.",color:"#FFD666"},
    {num:"05",icon:"\uD83D\uDCC4",title:"Full session export",desc:"Download a clean, annotated transcript with all flagged claims and their sourced context attached.",color:"#FF6B9D"},
  ];

  useEffect(()=>{const i=setInterval(()=>setGlow(g=>!g),2000);return()=>clearInterval(i);},[]);
  useEffect(()=>{
    const timers=FEATURES.map((_,i)=>setTimeout(()=>setVisibleFeatures(v=>[...v,i]),400+i*150));
    return()=>timers.forEach(clearTimeout);
  },[]);

  return (
    <div style={{minHeight:"100vh",background:"#08080F",color:"#E8E8F0",overflowX:"hidden"}}>
      {/* Background effects */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",width:800,height:800,borderRadius:"50%",background:"radial-gradient(circle,rgba(108,99,255,0.07) 0%,transparent 70%)",top:"-20%",left:"-10%",animation:"float 8s ease-in-out infinite"}}/>
        <div style={{position:"absolute",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,210,255,0.05) 0%,transparent 70%)",top:"30%",right:"-15%",animation:"float 10s ease-in-out infinite reverse"}}/>
        <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(74,222,128,0.04) 0%,transparent 70%)",bottom:"-10%",left:"20%",animation:"float 12s ease-in-out infinite"}}/>
      </div>

      {/* Nav */}
      <nav style={{position:"relative",zIndex:10,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 48px",maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#6C63FF,#00D2FF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,boxShadow:glow?"0 0 30px rgba(108,99,255,0.5)":"0 0 15px rgba(108,99,255,0.2)",transition:"box-shadow 2s"}}>F</div>
          <span style={{fontSize:22,fontWeight:800,letterSpacing:"-0.03em"}}>Footnote</span>
        </div>
        <div style={{display:"flex",gap:12}}>
          <Btn onClick={()=>setPage("signin")} style={{padding:"10px 24px",fontSize:14}}>Sign In</Btn>
          <Btn primary onClick={()=>setPage("signup")} style={{padding:"10px 24px",fontSize:14}}>Get Started</Btn>
        </div>
      </nav>

      {/* Hero */}
      <section style={{position:"relative",zIndex:1,textAlign:"center",padding:"100px 24px 80px",maxWidth:900,margin:"0 auto"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"6px 16px",borderRadius:100,background:"rgba(108,99,255,0.1)",border:"1px solid rgba(108,99,255,0.2)",marginBottom:32,fontSize:13,color:"#A5A0FF",fontWeight:600}}>
          <Pulse color="#6C63FF" size={8}/>Live transcription &middot; Fact verification &middot; Real-time
        </div>
        <h1 style={{fontSize:"clamp(40px,6vw,72px)",fontWeight:800,lineHeight:1.05,letterSpacing:"-0.04em",margin:"0 0 24px"}}>
          Every claim.{"\n"}
          <span style={{background:"linear-gradient(135deg,#6C63FF,#00D2FF)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Accountable,</span>
          <br/>instantly.
        </h1>
        <p style={{fontSize:"clamp(16px,2vw,20px)",lineHeight:1.6,color:"#888",maxWidth:560,margin:"0 auto 48px",fontWeight:300}}>
          Footnote listens, transcribes, and highlights every verifiable claim in real time — so you can focus on what matters.
        </p>
        <div style={{display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap"}}>
          <Btn primary onClick={()=>setPage("signup")} style={{padding:"16px 40px",fontSize:16,borderRadius:14,boxShadow:"0 0 30px rgba(108,99,255,0.3)"}}>Get Started Free</Btn>
          <Btn onClick={()=>setPage("signin")} style={{padding:"16px 40px",fontSize:16,borderRadius:14}}>Sign In</Btn>
        </div>
      </section>

      {/* Demo preview */}
      <section style={{position:"relative",zIndex:1,maxWidth:900,margin:"0 auto 120px",padding:"0 24px"}}>
        <div style={{borderRadius:20,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.02)",backdropFilter:"blur(20px)",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.4)"}}>
          {/* Window chrome */}
          <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:12,height:12,borderRadius:"50%",background:"#FF5F57"}}/>
            <div style={{width:12,height:12,borderRadius:"50%",background:"#FEBC2E"}}/>
            <div style={{width:12,height:12,borderRadius:"50%",background:"#28C840"}}/>
            <span style={{marginLeft:12,fontSize:12,color:"#555"}}>Live Session — Q4 Strategy Meeting</span>
          </div>
          {/* Transcript lines */}
          <div style={{padding:"24px 28px",display:"flex",flexDirection:"column",gap:12}}>
            {DEMO.slice(0,4).map((s,i)=>(
              <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",opacity:0,animation:`fadeSlideIn 0.5s ease ${0.8+i*0.2}s forwards`}}>
                <div style={{width:28,height:28,borderRadius:8,background:SP[s.speaker]?.bg||SP[0].bg,color:SP[s.speaker]?.color||SP[0].color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,marginTop:2}}>{SP[s.speaker]?.initial||"?"}</div>
                <div style={{flex:1}}>
                  <span style={{fontSize:13,color:"#E8E8F0",lineHeight:1.6}}>{s.text}</span>
                  {s.isClaim&&<span style={{marginLeft:8,padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700,background:"rgba(255,214,102,0.15)",color:"#FFD666"}}>CLAIM</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{position:"relative",zIndex:1,maxWidth:1100,margin:"0 auto",padding:"0 24px 120px"}}>
        <div style={{textAlign:"center",marginBottom:64}}>
          <p style={{fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"#6C63FF",marginBottom:12}}>Features</p>
          <h2 style={{fontSize:"clamp(28px,4vw,44px)",fontWeight:800,letterSpacing:"-0.03em",lineHeight:1.1}}>Everything happens live</h2>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          {FEATURES.map((f,i)=>(
            <div key={f.num} style={{display:"flex",gap:24,alignItems:"flex-start",padding:"32px 36px",borderRadius:20,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",transition:"all 0.5s cubic-bezier(0.16,1,0.3,1)",opacity:visibleFeatures.includes(i)?1:0,transform:visibleFeatures.includes(i)?"translateY(0)":"translateY(20px)"}}>
              <div style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,fontWeight:700,color:f.color,opacity:0.6}}>{f.num}</span>
                <span style={{fontSize:32}}>{f.icon}</span>
              </div>
              <div>
                <h3 style={{fontSize:20,fontWeight:700,marginBottom:6,color:"#E8E8F0"}}>{f.title}</h3>
                <p style={{fontSize:15,lineHeight:1.6,color:"#888",margin:0}}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{position:"relative",zIndex:1,textAlign:"center",padding:"80px 24px 120px"}}>
        <div style={{maxWidth:600,margin:"0 auto",padding:"60px 40px",borderRadius:24,background:"linear-gradient(135deg,rgba(108,99,255,0.08),rgba(0,210,255,0.06))",border:"1px solid rgba(108,99,255,0.15)"}}>
          <h2 style={{fontSize:"clamp(24px,3.5vw,36px)",fontWeight:800,letterSpacing:"-0.03em",marginBottom:12}}>Ready to try Footnote?</h2>
          <p style={{fontSize:16,color:"#888",marginBottom:32,lineHeight:1.6}}>Start your first live session in seconds. No credit card required.</p>
          <Btn primary onClick={()=>setPage("signup")} style={{padding:"16px 48px",fontSize:16,borderRadius:14,boxShadow:"0 0 30px rgba(108,99,255,0.3)"}}>Get Started Free</Btn>
        </div>
      </section>

      {/* Footer */}
      <footer style={{position:"relative",zIndex:1,borderTop:"1px solid rgba(255,255,255,0.06)",padding:"32px 48px",maxWidth:1200,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:24,height:24,borderRadius:8,background:"linear-gradient(135deg,#6C63FF,#00D2FF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800}}>F</div>
          <span style={{fontSize:14,fontWeight:700}}>Footnote</span>
        </div>
        <span style={{fontSize:12,color:"#555"}}>&copy; 2026 Footnote. All rights reserved.</span>
      </footer>

      <style>{`
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}

function AuthPage({mode}) {
  const {setPage,setAuth,setUser}=useApp(); const isUp=mode==="signup";
  const googleBtnRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: "650211070245-jsq1p1b9e0t12ov44acjag7t1vtvg49d.apps.googleusercontent.com",
        callback: handleGoogleResponse,
      });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "filled_black",
          size: "large",
          width: 320,
          text: "continue_with",
          shape: "pill",
        });
      }
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const handleGoogleResponse = async (response: any) => {
    setError("");
    try {
      const res = await fetch("/api/auth/google/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Authentication failed"); return; }
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      setAuth(true);
      setPage("dashboard");
    } catch {
      setError("Network error. Please try again.");
    }
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:400,padding:40,borderRadius:24,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",backdropFilter:"blur(20px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:32,cursor:"pointer"}} onClick={()=>setPage("landing")}>
          <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#6C63FF,#00D2FF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800}}>F</div>
          <span style={{fontSize:18,fontWeight:700}}>Footnote</span>
        </div>
        <h2 style={{fontSize:24,fontWeight:800,marginBottom:8}}>{isUp?"Create account":"Welcome back"}</h2>
        <p style={{fontSize:13,color:"#888",marginBottom:28}}>{isUp?"Start verifying claims in minutes":"Sign in to your account"}</p>
        <div style={{display:"flex",flexDirection:"column",gap:16,alignItems:"center"}}>
          <div ref={googleBtnRef} />
          {error && <p style={{fontSize:13,color:"#ff6b6b",textAlign:"center"}}>{error}</p>}
        </div>
        <p style={{fontSize:13,color:"#666",textAlign:"center",marginTop:20}}>{isUp?"Already have an account? ":"Don't have an account? "}<span style={{color:"#6C63FF",cursor:"pointer",fontWeight:600}} onClick={()=>setPage(isUp?"signin":"signup")}>{isUp?"Sign In":"Sign Up"}</span></p>
      </div>
    </div>
  );
}

function DashboardPage() {
  const {setPage}=useApp();
  return (
    <div style={{padding:32,maxWidth:1100,margin:"0 auto"}}>
      <div style={{marginBottom:32}}><h1 style={{fontSize:28,fontWeight:800,marginBottom:4}}>Dashboard</h1><p style={{fontSize:14,color:"#888"}}>Welcome back. Here's your recent activity.</p></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:32}}>
        {[["Sessions","12","#6C63FF"],["Claims Found","87","#FFD666"],["Papers Saved","4","#00D2FF"],["Hours Saved","6.5h","#4ADE80"]].map(([l,v,c])=>(
          <Card key={l}><div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#666",marginBottom:8}}>{l}</div><div style={{fontSize:28,fontWeight:800,color:c}}>{v}</div></Card>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:32}}>
        <Card onClick={()=>setPage("verify")} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:16,border:"1px solid rgba(108,99,255,0.2)",background:"rgba(108,99,255,0.04)"}}>
          <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#6C63FF,#00D2FF)",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg></div>
          <div><div style={{fontSize:15,fontWeight:700}}>New Session</div><div style={{fontSize:12,color:"#888"}}>Start a live transcription or paste text</div></div>
        </Card>
        <Card onClick={()=>setPage("papers")} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:48,height:48,borderRadius:14,background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
          <div><div style={{fontSize:15,fontWeight:700}}>Saved Papers</div><div style={{fontSize:12,color:"#888"}}>View and manage analyzed documents</div></div>
        </Card>
      </div>
      <div style={{marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2 style={{fontSize:18,fontWeight:700}}>Recent Sessions</h2><Btn small onClick={()=>setPage("sessions")}>View All</Btn></div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {SAVED_SESSIONS.slice(0,3).map(s=>(
          <Card key={s.id} onClick={()=>setPage("session-"+s.id)} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px"}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:40,height:40,borderRadius:12,background:"rgba(108,99,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2" strokeLinecap="round"><path d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg></div>
              <div><div style={{fontSize:14,fontWeight:600}}>{s.title}</div><div style={{fontSize:12,color:"#666"}}>{s.date} · {s.duration}</div></div>
            </div>
            <div style={{display:"flex",gap:12,alignItems:"center"}}><Badge color="#FFD666">{s.claims} claims</Badge><Badge color="#6C63FF">{s.speakers} speakers</Badge></div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SessionsPage() {
  const {setPage}=useApp();
  return (
    <div style={{padding:32,maxWidth:900,margin:"0 auto"}}>
      <h1 style={{fontSize:28,fontWeight:800,marginBottom:4}}>Saved Sessions</h1><p style={{fontSize:14,color:"#888",marginBottom:28}}>Browse your recorded transcription sessions.</p>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {SAVED_SESSIONS.map(s=>(
          <Card key={s.id} onClick={()=>setPage("session-"+s.id)} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 22px"}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:44,height:44,borderRadius:12,background:"rgba(108,99,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2" strokeLinecap="round"><path d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg></div>
              <div><div style={{fontSize:15,fontWeight:700}}>{s.title}</div><div style={{fontSize:12,color:"#666"}}>{s.date} · {s.duration} · {s.speakers} speakers</div></div>
            </div>
            <Badge color="#FFD666">{s.claims} claims</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SessionDetailPage({id}) {
  const {setPage}=useApp();
  const [session,setSession]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [panel,setPanel]=useState(false);

  useEffect(()=>{
    const fetchSession = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`/api/sessions/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        setSession(data.session || data);
      } catch {}
      setLoading(false);
    };
    // Try fetching from backend first, fall back to demo data
    const demoSession = SAVED_SESSIONS.find(s=>s.id===id);
    if (demoSession && demoSession.segments.length > 0) {
      setSession(demoSession);
      setLoading(false);
    } else {
      fetchSession();
    }
  },[id]);

  if (loading) return <div style={{padding:40,textAlign:"center",color:"#666"}}>Loading session...</div>;
  if (!session) return <div style={{padding:40}}>Session not found.</div>;

  // Normalize: support both demo format and backend format
  const segs = session.segments || (session.sentences || []).map((s:any,i:number) => ({
    text: s.content || s.text,
    speaker: s.speaker_id ? parseInt(s.speaker_id) || 0 : (s.speaker ?? 0),
    isClaim: s.is_claim ?? s.isClaim ?? false,
    claimData: s.claim ? {
      verdict: s.claim.verdict,
      confidence: s.claim.confidence_score,
      summary: s.claim.summary,
      sources: (s.claim.sources || []).map((src:any) => ({
        title: src.paper?.title || src.title,
        authors: src.paper?.authors || src.authors,
        year: src.paper?.year || src.year,
        url: src.paper?.source_url || src.url,
        excerpt: src.excerpt,
        supports: src.supports,
      })),
    } : undefined,
    timestamp: s.timestamp || "",
  }));
  const allClaims = segs.filter((s:any)=>s.isClaim);

  return (
    <div style={{display:"flex",height:"calc(100vh - 56px)",overflow:"hidden"}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"16px 24px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button onClick={()=>setPage("sessions")} style={{background:"none",border:"none",color:"#888",cursor:"pointer",fontSize:14,padding:0}}>← Back</button>
              <h2 style={{fontSize:18,fontWeight:700,margin:0}}>{session.title}</h2>
            </div>
            <p style={{fontSize:12,color:"#666",margin:"4px 0 0"}}>{session.date || session.started_at} · {allClaims.length} claims · {segs.length} sentences</p>
          </div>
          <div style={{display:"flex",gap:8}}><Badge color="#4ADE80">Saved</Badge>{allClaims.length>0&&<Btn small onClick={()=>setPanel(!panel)}>{panel?"Hide":"Show"} Claims</Btn>}</div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
          {segs.length===0?<p style={{color:"#666",textAlign:"center",marginTop:60}}>Full transcript data not available for this session.</p>:
            segs.map((seg:any,i:number)=>{const sp=SP[seg.speaker]||SP[0];const prev=i>0?segs[i-1].speaker:-1;const showH=seg.speaker!==prev;return(
              <div key={i}>
                {showH&&<div style={{display:"flex",alignItems:"center",gap:8,marginTop:i>0?16:0,marginBottom:6}}><div style={{width:28,height:28,borderRadius:8,background:`linear-gradient(135deg,${sp.color},${sp.color}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700}}>{sp.initial}</div><span style={{fontSize:13,fontWeight:600,color:sp.color}}>{sp.name}</span>{seg.timestamp&&<span style={{fontSize:11,color:"#555",fontFamily:"monospace"}}>{seg.timestamp}</span>}</div>}
                <div onClick={()=>{if(seg.isClaim)setPanel(true);}} style={{padding:"8px 12px",marginLeft:36,borderRadius:10,cursor:seg.isClaim?"pointer":"default",background:seg.isClaim?"rgba(255,214,102,0.08)":"transparent",borderLeft:seg.isClaim?"3px solid #FFD666":"3px solid transparent"}}>
                  <span style={{fontSize:14,lineHeight:1.65,color:seg.isClaim?"#FFE8A0":"#ccc"}}>{seg.text}</span>
                  {seg.isClaim&&(
                    <span style={{marginLeft:8,display:"inline-flex",gap:6,alignItems:"center"}}>
                      <Badge color="#FFD666">Claim</Badge>
                      {seg.claimData?.verdict && <Badge color={seg.claimData.verdict==="supported"?"#4ADE80":seg.claimData.verdict==="contradicted"?"#FF6B6B":"#888"}>{seg.claimData.verdict}</Badge>}
                    </span>
                  )}
                </div>
              </div>
            );})}
        </div>
      </div>
      <ClaimCardStack claims={allClaims} open={panel} onClose={()=>setPanel(false)}/>
    </div>
  );
}

function PapersPage() {
  const {setPage}=useApp();
  return (
    <div style={{padding:32,maxWidth:900,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
        <div><h1 style={{fontSize:28,fontWeight:800,margin:0}}>Saved Papers</h1><p style={{fontSize:14,color:"#888",marginTop:4}}>Documents you've analyzed for claims.</p></div>
        <Btn primary onClick={()=>setPage("verify")}>+ New Paper</Btn>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {SAVED_PAPERS.map(p=>(
          <Card key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 22px"}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:44,height:44,borderRadius:12,background:"rgba(0,210,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D2FF" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
              <div><div style={{fontSize:15,fontWeight:700}}>{p.title}</div><div style={{fontSize:12,color:"#666"}}>{p.date} · {p.claims} claims</div></div>
            </div>
            <Badge color={p.status==="Verified"?"#4ADE80":p.status==="In Progress"?"#FFD666":"#888"}>{p.status}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Verify Page ──
function VerifyPage() {
  const [tab,setTab]=useState("live");
  return (
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 56px)"}}>
      <div style={{padding:"12px 24px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:4}}>
        {["live","text"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"8px 20px",borderRadius:10,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:tab===t?"rgba(108,99,255,0.15)":"transparent",color:tab===t?"#A5A0FF":"#666",transition:"all 0.2s"}}>{t==="live"?"Live Mode":"Text Input"}</button>)}
      </div>
      {tab==="live"?<LiveMode/>:<TextMode/>}
    </div>
  );
}

function LiveMode() {
  const [rec, setRec] = useState(false);
  const [paused, setPaused] = useState(false);
  const [sentences, setSentences] = useState<any[]>([]);
  const [partialText, setPartialText] = useState("");
  const [panel, setPanel] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const elapsedRef = useRef(0);
  const pausedRef = useRef(false);
  const speakerMapRef = useRef<Record<string, number>>({});
  const nextSpIdxRef = useRef(0);
  // Maps a merged sentenceId → the parent sentenceId it was merged into
  const mergeMapRef = useRef<Record<string, string>>({});
  // Buffer for accumulating transcript text until a sentence boundary is hit
  const sentenceBufferRef = useRef<{ text: string; speakerId: string }>({ text: "", speakerId: "" });
  const sentenceCounterRef = useRef(0);

  const claims = sentences.filter(s => s.claim === true);

  // Timer pauses when recording is paused
  useEffect(() => {
    if (!rec || paused) return;
    const i = setInterval(() => { elapsedRef.current += 1; setElapsed(elapsedRef.current); }, 1000);
    return () => clearInterval(i);
  }, [rec, paused]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [sentences, partialText]);

  const getSpeakerIdx = useCallback((speakerId: string) => {
    if (!(speakerId in speakerMapRef.current)) {
      speakerMapRef.current[speakerId] = nextSpIdxRef.current % SP.length;
      nextSpIdxRef.current++;
    }
    return speakerMapRef.current[speakerId];
  }, []);

  const resetState = useCallback(() => {
    setSentences([]); setPartialText(""); setPanel(false);
    setElapsed(0); elapsedRef.current = 0;
    setError(null); setShowSaveModal(false);
    speakerMapRef.current = {}; nextSpIdxRef.current = 0;
    mergeMapRef.current = {};
    sentenceBufferRef.current = { text: "", speakerId: "" };
    sentenceCounterRef.current = 0;
    pausedRef.current = false; setPaused(false);
  }, []);

  // POST a sentence to the backend; update its claim status when the response arrives.
  // Resolves through mergeMapRef in case this sentence was merged into a parent sentence.
  const checkClaim = useCallback(async (sentence: any) => {
    const resolvedId = mergeMapRef.current[sentence.sentenceId] ?? sentence.sentenceId;
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("/api/check-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ sentenceId: resolvedId, speakerId: sentence.speakerId, text: sentence.text }),
      });
      const result = await res.json();
      const isClaim = result.is_claim === true;
      const claimData = isClaim ? {
        verdict: result.verdict,
        confidence: result.confidence,
        summary: result.summary,
        sources: result.sources || [],
      } : undefined;
      setSentences(prev => prev.map(s =>
        s.sentenceId === resolvedId
          ? { ...s, claim: isClaim, ...(claimData ? { claimData } : {}) }
          : s
      ));
      if (isClaim) setPanel(true);
    } catch {
      setSentences(prev => prev.map(s => s.sentenceId === resolvedId ? { ...s, claim: false } : s));
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop()); streamRef.current = null; }
    if (clientRef.current) { try { clientRef.current.stopRecognition({ noTimeout: true }); } catch {} clientRef.current = null; }
    speakerMapRef.current = {}; nextSpIdxRef.current = 0; mergeMapRef.current = {};
    setRec(false); setPartialText("");
  }, []);

  const handleStop = useCallback(() => { stopRecording(); setShowSaveModal(true); }, [stopRecording]);

  const togglePause = useCallback(() => {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    if (next) setPartialText("");
  }, []);

  const saveSession = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          title: `Session ${new Date().toLocaleString()}`,
          sentences: sentences.map(s => ({
            speakerId: s.speakerId,
            text: s.text,
            isClaim: s.claim === true,
            ...(s.claimData ? { claimData: s.claimData } : {}),
          })),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Save failed");
      resetState();
    } catch (err) {
      setError((err instanceof Error ? err.message : null) || "Failed to save session");
      setShowSaveModal(false);
    } finally {
      setSaving(false);
    }
  };

  const startRecording = useCallback(async () => {
    try {
      setError(null); elapsedRef.current = 0; setElapsed(0);
      pausedRef.current = false; setPaused(false);

      const tokenRes = await fetch("/api/speechmatics-token");
      const tokenData = await tokenRes.json();
      if (tokenData.error) throw new Error(tokenData.error);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const { RealtimeClient } = await import("@speechmatics/real-time-client");
      const client = new RealtimeClient();
      clientRef.current = client;

      // Joins word-level results from one AddTranscript event into a single sentence string
      const joinResults = (results: any[]) =>
        (results || []).map((r: any) => r.alternatives?.[0]?.content ?? "").join(" ").trim();

      client.addEventListener("receiveMessage", ({ data }) => {
        if (data.message === "AddPartialTranscript") {
          if (!pausedRef.current) setPartialText(data.metadata?.transcript || "");
        } else if (data.message === "AddTranscript") {
          setPartialText("");
          // Build the complete sentence from word-level results
          const sentenceText = joinResults(data.results);
          if (!sentenceText) return;
          const speakerId = data.results?.[0]?.alternatives?.[0]?.speaker || "S1";
          const speakerIdx = getSpeakerIdx(speakerId);

          // Accumulate text into buffer, split on sentence-ending punctuation
          const buf = sentenceBufferRef.current;
          if (buf.speakerId && buf.speakerId !== speakerId && buf.text.trim()) {
            // Speaker changed — flush whatever is in the buffer as a sentence
            sentenceCounterRef.current++;
            const id = sentenceCounterRef.current;
            const flushed = buf.text.trim();
            const flushedSpeaker = buf.speakerId;
            console.table([{ id, speaker: flushedSpeaker, sentence: flushed }]);
            buf.text = "";
          }
          buf.speakerId = speakerId;
          buf.text += (buf.text ? " " : "") + sentenceText;

          // Extract complete sentences (ending with . ? ! … or similar)
          const sentenceEndPattern = /([^.!?…]+[.!?…]+)/g;
          let match;
          const completeSentences: string[] = [];
          let lastIndex = 0;
          while ((match = sentenceEndPattern.exec(buf.text)) !== null) {
            completeSentences.push(match[1].trim());
            lastIndex = sentenceEndPattern.lastIndex;
          }
          // Keep the remainder (incomplete sentence) in the buffer
          buf.text = buf.text.slice(lastIndex);

          // Create a separate sentence entry for each complete sentence and check each individually
          for (const s of completeSentences) {
            if (!s) continue;
            sentenceCounterRef.current++;
            const sId = Math.random().toString(36).slice(2) + Date.now().toString(36) + sentenceCounterRef.current;
            const newSentence = {
              sentenceId: sId, speakerId, speaker: speakerIdx, text: s,
              timestamp: fmt(elapsedRef.current),
              claim: null as null | boolean,
            };
            setSentences(prev => [...prev, newSentence]);
            checkClaim(newSentence);
          }
        } else if (data.message === "EndOfTranscript") {
          // Flush any remaining text in the sentence buffer
          const buf = sentenceBufferRef.current;
          if (buf.text.trim()) {
            sentenceCounterRef.current++;
            console.table([{ id: sentenceCounterRef.current, speaker: buf.speakerId, sentence: buf.text.trim() }]);
            buf.text = ""; buf.speakerId = "";
          }
          setRec(false); setPartialText(""); setShowSaveModal(true);
        } else if (data.message === "Error") {
          setError(`Speechmatics: ${data.reason || JSON.stringify(data)}`);
          stopRecording();
        }
      });

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!clientRef.current || pausedRef.current) return;
        const float32 = e.inputBuffer.getChannelData(0);
        const int16 = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
          int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32767));
        }
        clientRef.current.sendAudio(int16.buffer);
      };

      await client.start(tokenData.jwt, {
        transcription_config: {
          language: "en", operating_point: "enhanced",
          max_delay: 2.0, enable_partials: true, diarization: "speaker",
          transcript_filtering_config: { remove_disfluencies: true },
          "speaker_diarization_config": {
                "speaker_sensitivity": 0.6
    }
        },
        audio_format: { type: "raw" as const, encoding: "pcm_s16le" as const, sample_rate: audioContext.sampleRate },
      });

      const silentDest = audioContext.createMediaStreamDestination();
      source.connect(processor);
      processor.connect(silentDest);
      setRec(true);
    } catch (err) {
      setError((err instanceof Error ? err.message : null) || "Failed to start recording");
      stopRecording();
    }
  }, [getSpeakerIdx, checkClaim, stopRecording]);

  // ── Pre-recording: centered mic ──
  if (!rec && !paused && sentences.length === 0 && !showSaveModal) {
    return (
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:20}}>
        {error && <div style={{padding:"10px 20px",borderRadius:10,background:"rgba(255,68,68,0.1)",color:"#FF6B6B",fontSize:13,marginBottom:4}}>{error}</div>}
        <button onClick={startRecording} style={{width:96,height:96,borderRadius:"50%",border:"none",cursor:"pointer",background:"linear-gradient(135deg,#6C63FF,#00D2FF)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 0 16px rgba(108,99,255,0.06),0 0 48px rgba(108,99,255,0.35)",transition:"all 0.3s"}}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="white"><path d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
        <p style={{fontSize:14,color:"#555",letterSpacing:"0.03em"}}>Click to start recording</p>
      </div>
    );
  }

  // ── Recording / post-recording view ──
  return (
    <div style={{flex:1,display:"flex",overflow:"hidden",position:"relative"}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
        {error && <div style={{padding:"10px 24px",background:"rgba(255,68,68,0.08)",borderBottom:"1px solid rgba(255,68,68,0.15)",fontSize:13,color:"#FF6B6B",flexShrink:0}}>{error}</div>}

        {/* Transcript scroll area */}
        <div ref={scrollRef} style={{flex:1,overflowY:"auto",padding:"24px 28px",display:"flex",flexDirection:"column",gap:2}}>
          {sentences.length === 0 && (
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",opacity:.35}}>
              <p style={{fontSize:14,color:"#666"}}>Listening…</p>
            </div>
          )}
          {sentences.map((s, i) => {
            const sp = SP[s.speaker] || SP[0];
            const showHeader = i === 0 || sentences[i - 1].speaker !== s.speaker;
            return (
              <div key={s.sentenceId} style={{animation:"fadeIn 0.3s ease"}}>
                {showHeader && (
                  <div style={{display:"flex",alignItems:"center",gap:8,marginTop:i>0?20:0,marginBottom:6}}>
                    <div style={{width:28,height:28,borderRadius:8,background:`linear-gradient(135deg,${sp.color},${sp.color}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700}}>{sp.initial}</div>
                    <span style={{fontSize:13,fontWeight:600,color:sp.color}}>{sp.name}</span>
                    <span style={{fontSize:11,color:"#555",fontFamily:"monospace"}}>{s.timestamp}</span>
                  </div>
                )}
                <div
                  onClick={() => { if (s.claim === true) setPanel(true); }}
                  style={{padding:"8px 12px",marginLeft:36,borderRadius:10,cursor:s.claim===true?"pointer":"default",background:s.claim===true?"rgba(255,214,102,0.08)":"transparent",borderLeft:s.claim===true?"3px solid #FFD666":s.claim===null?"3px solid rgba(108,99,255,0.25)":"3px solid transparent",transition:"border-color 0.5s,background 0.5s"}}
                >
                  <span style={{fontSize:14,lineHeight:1.65,color:s.claim===true?"#FFE8A0":"#ccc"}}>{s.text}</span>
                  {s.claim === true && (
                    <span style={{marginLeft:8,display:"inline-flex",gap:6,alignItems:"center"}}>
                      <Badge color="#FFD666">Claim</Badge>
                      {s.claimData?.verdict && (
                        <Badge color={s.claimData.verdict==="supported"?"#4ADE80":s.claimData.verdict==="contradicted"?"#FF6B6B":s.claimData.verdict==="misleading"?"#FF9F43":"#888"}>
                          {s.claimData.verdict}
                        </Badge>
                      )}
                    </span>
                  )}
                  {s.claim === null && <span style={{marginLeft:8,display:"inline-flex",alignItems:"center",gap:4,fontSize:11,color:"#444"}}><Pulse color="#6C63FF" size={6}/>checking</span>}
                </div>
              </div>
            );
          })}
          {/* Partial (provisional) text */}
          {rec && !paused && partialText && (
            <div style={{animation:"fadeIn 0.2s ease",marginTop:4}}>
              <div style={{padding:"8px 12px",marginLeft:36,borderRadius:10}}>
                <span style={{fontSize:14,lineHeight:1.65,color:"#444",fontStyle:"italic"}}>{partialText}<span style={{animation:"blink 1s infinite",color:"#6C63FF"}}>|</span></span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div style={{padding:"12px 24px",borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
          <WaveBar active={rec && !paused}/>
          <span style={{fontFamily:"monospace",fontSize:13,color:"#888",minWidth:42}}>{fmt(elapsed)}</span>
          <div style={{flex:1}}/>
          <Badge color="#FFD666">{claims.length} claim{claims.length!==1?"s":""}</Badge>
          {paused && <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,background:"rgba(255,214,102,0.08)",border:"1px solid rgba(255,214,102,0.2)"}}><div style={{width:6,height:6,borderRadius:"50%",background:"#FFD666"}}/><span style={{fontSize:11,fontWeight:600,color:"#FFD666"}}>Paused</span></div>}
          <Btn small onClick={togglePause} style={{minWidth:90,background:paused?"rgba(108,99,255,0.15)":"rgba(255,255,255,0.06)",color:paused?"#A5A0FF":"#ccc"}}>
            {paused ? "▶ Resume" : "⏸ Pause"}
          </Btn>
          <Btn small onClick={handleStop} style={{background:"rgba(255,68,102,0.1)",color:"#FF6B6B"}}>⏹ Stop</Btn>
        </div>
      </div>

      <ClaimCardStack claims={claims} open={panel} onClose={() => setPanel(false)}/>

      {/* Save session modal */}
      {showSaveModal && (
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,backdropFilter:"blur(4px)"}}>
          <div style={{width:420,padding:36,borderRadius:24,background:"rgba(14,14,26,0.98)",border:"1px solid rgba(255,255,255,0.1)",boxShadow:"0 24px 80px rgba(0,0,0,0.6)"}}>
            <h3 style={{fontSize:22,fontWeight:800,margin:"0 0 6px"}}>Save this session?</h3>
            <p style={{fontSize:13,color:"#666",margin:"0 0 24px"}}>Your recording has stopped. Would you like to save it?</p>
            <div style={{display:"flex",gap:24,marginBottom:24}}>
              <div style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,color:"#6C63FF"}}>{sentences.length}</div><div style={{fontSize:11,color:"#666",marginTop:2}}>Sentences</div></div>
              <div style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,color:"#FFD666"}}>{claims.length}</div><div style={{fontSize:11,color:"#666",marginTop:2}}>Claims</div></div>
              <div style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,color:"#00D2FF"}}>{fmt(elapsed)}</div><div style={{fontSize:11,color:"#666",marginTop:2}}>Duration</div></div>
            </div>
            {error && <div style={{padding:"8px 12px",borderRadius:8,background:"rgba(255,68,68,0.08)",color:"#FF6B6B",fontSize:12,marginBottom:16}}>{error}</div>}
            <div style={{display:"flex",gap:12}}>
              <Btn primary onClick={saveSession} style={{flex:1,padding:"12px 0",opacity:saving?.5:1,pointerEvents:saving?"none":"auto"}}>
                {saving ? "Saving…" : "Save Session"}
              </Btn>
              <Btn onClick={() => { setShowSaveModal(false); resetState(); }} style={{flex:1,padding:"12px 0"}}>Discard</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TextMode() {
  const [text,setText]=useState("");
  const [results,setResults]=useState(null);
  const [panel,setPanel]=useState(false);
  const analyze=()=>{
    const sentences=text.split(/(?<=[.!?])\s+/).filter(Boolean);
    const r=sentences.map((s,i)=>{
      const isClaim=/\d+%|grew|increased|decreased|always|never|most|every|research shows|studies|according|billion|million|fastest|largest|significantly/.test(s.toLowerCase());
      return{text:s,speaker:0,isClaim,...(isClaim?{claimCategory:CATS[i%CATS.length],confidence:Math.floor(Math.random()*40+55),context:"This statement contains a verifiable assertion that could be fact-checked against primary sources."}:{})};
    });
    setResults(r);
  };
  const claims = (results||[]).filter(r=>r.isClaim);
  return (
    <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",padding:24,gap:16}}>
        {!results?<>
          <p style={{fontSize:14,color:"#888",margin:0}}>Paste any text below to analyze it for claims.</p>
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Paste your text, article, or transcript here..." style={{flex:1,padding:16,borderRadius:14,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.03)",color:"#E8E8F0",fontSize:14,lineHeight:1.7,resize:"none",outline:"none",fontFamily:"inherit"}}/>
          <Btn primary onClick={analyze} style={{alignSelf:"flex-end",opacity:text.trim()?1:.4,pointerEvents:text.trim()?"auto":"none"}}>Analyze Text</Btn>
        </>:<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><p style={{fontSize:14,color:"#888",margin:0}}>Found <strong style={{color:"#FFD666"}}>{claims.length}</strong> claims in {results.length} sentences.</p><div style={{display:"flex",gap:8}}>{claims.length>0&&<Btn small onClick={()=>setPanel(!panel)}>{panel?"Hide":"Show"} Claims</Btn>}<Btn small onClick={()=>{setResults(null);setText("")}}>New Analysis</Btn></div></div>
          <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
            {results.map((r,i)=>(
              <div key={i} onClick={()=>{if(r.isClaim)setPanel(true)}} style={{padding:"10px 14px",borderRadius:10,cursor:r.isClaim?"pointer":"default",background:r.isClaim?"rgba(255,214,102,0.08)":"transparent",borderLeft:r.isClaim?"3px solid #FFD666":"3px solid transparent"}}>
                <span style={{fontSize:14,lineHeight:1.65,color:r.isClaim?"#FFE8A0":"#ccc"}}>{r.text}</span>{r.isClaim&&<span style={{marginLeft:8}}><Badge color="#FFD666">Claim</Badge></span>}
              </div>
            ))}
          </div>
        </>}
      </div>
      <ClaimCardStack claims={claims} open={panel} onClose={()=>setPanel(false)}/>
    </div>
  );
}

// ── Nav ──
function NavShell({children}) {
  const {page,setPage,handleSignOut}=useApp();
  const nav=[
    {id:"dashboard",label:"Dashboard",icon:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4"},
    {id:"verify",label:"Verify",icon:"M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z"},
    {id:"sessions",label:"Sessions",icon:"M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"},
    {id:"papers",label:"Papers",icon:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"},
  ];
  const active=nav.find(n=>page.startsWith(n.id))?.id||"";
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh"}}>
      <div style={{height:56,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,0.06)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setPage("dashboard")}>
          <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#6C63FF,#00D2FF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800}}>F</div>
          <span style={{fontSize:16,fontWeight:700}}>Footnote</span>
        </div>
        <div style={{display:"flex",gap:2}}>
          {nav.map(n=><button key={n.id} onClick={()=>setPage(n.id)} style={{padding:"8px 16px",borderRadius:10,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:active===n.id?"rgba(108,99,255,0.12)":"transparent",color:active===n.id?"#A5A0FF":"#888",transition:"all 0.2s",display:"flex",alignItems:"center",gap:6}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={n.icon}/></svg>{n.label}</button>)}
        </div>
        <button onClick={handleSignOut} style={{padding:"6px 14px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:"rgba(255,255,255,0.04)",color:"#888"}}>Sign Out</button>
      </div>
      <div style={{flex:1,overflow:"hidden"}}>{children}</div>
    </div>
  );
}

// ── App ──
export default function App() {
  const [page,setPage]=useState("landing");
  const [auth,setAuth]=useState(false);
  const [user,setUser]=useState(null);

  useEffect(()=>{
    const token = localStorage.getItem("access_token");
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) {
      setAuth(true);
      setUser(JSON.parse(savedUser));
      setPage("dashboard");
    }
  },[]);

  const handleSignOut = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setAuth(false);
    setUser(null);
    setPage("landing");
  };

  const renderPage=()=>{
    if (page === "landing") return <LandingPage />;
    if (page === "signin") return <AuthPage mode="signin" />;
    if (page === "signup") return <AuthPage mode="signup" />;
    if (page.startsWith("session-")) { const id = parseInt(page.split("-")[1]); return <NavShell><SessionDetailPage id={id} /></NavShell>; }
    const inner = { dashboard: <DashboardPage />, verify: <VerifyPage />, sessions: <SessionsPage />, papers: <PapersPage /> }[page] || <DashboardPage />;
    return <NavShell>{inner}</NavShell>;
  };
  return (
    <AppCtx.Provider value={{page,setPage,auth,setAuth,user,setUser,handleSignOut}}>
      <div style={{minHeight:"100vh",background:"linear-gradient(145deg,#0a0a14 0%,#0f0f1e 50%,#0a0a18 100%)",color:"#E8E8F0",fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif"}}>
        {renderPage()}
        <style>{`
          @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
          @keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}
          @keyframes cardIn{from{opacity:0;transform:translateY(12px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
          ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}
          *{box-sizing:border-box;margin:0}
          input::placeholder,textarea::placeholder{color:#555}
        `}</style>
      </div>
    </AppCtx.Provider>
  );
}