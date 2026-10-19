import {useEffect,useRef,useState} from 'react';
import {translate as t,useLocale} from '../../shared/i18n/i18n';
import WallyTurnstile from '../../features/wally/WallyTurnstile';
import {useGameRecord} from './gameRecords';

export default function GameRankings({game}) {
  useLocale();const {record}=useGameRecord(game,0,false);
  const [rows,setRows]=useState([]),[alias,setAlias]=useState(''),[token,setToken]=useState(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[verification,setVerification]=useState(0);
  const requestRef=useRef(null);
  const enabled=import.meta.env.VITE_RANKINGS_ENABLED==='true';
  useEffect(()=>()=>requestRef.current?.abort(),[]);
  async function load(){requestRef.current?.abort();const controller=new AbortController();requestRef.current=controller;setMessage('');try{const response=await fetch('/api/rankings?game='+game,{cache:'no-store',signal:controller.signal});const data=await response.json();if(!response.ok||!Array.isArray(data.scores))throw Error();if(!controller.signal.aborted)setRows(data.scores);}catch{if(!controller.signal.aborted)setMessage(t('Ranking indisponível. Seu recorde local está preservado.'));}}
  async function submit(event){event.preventDefault();if(busy||!token||!record)return;setBusy(true);const controller=new AbortController();requestRef.current=controller;try{const response=await fetch('/api/rankings',{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({game,alias,score:record,turnstileToken:token})});if(!response.ok)throw Error();if(!controller.signal.aborted){setMessage(t('Recorde enviado.'));requestRef.current=null;await load();}}catch{if(!controller.signal.aborted)setMessage(t('Ranking indisponível. Seu recorde local está preservado.'));}finally{if(!controller.signal.aborted){setBusy(false);setToken(null);setVerification(v=>v+1);}}}
  if(!enabled)return null;
  return <section className="ws-app__card"><h3>{t('Ranking público')}</h3><p>{t('Envio opcional. Use um apelido público, sem dados pessoais. Pontuações do navegador estão sujeitas a fraude.')}</p><button onClick={load} disabled={busy}>{t('Atualizar ranking')}</button>
    <ol>{rows.map((row,index)=><li key={index}>{row.alias} · {row.score}</li>)}</ol>
    {record>0&&<form onSubmit={submit}><label>{t('Apelido público')}<input value={alias} onChange={event=>setAlias(event.target.value)} minLength={2} maxLength={24} pattern="[A-Za-zÀ-ÿ0-9 _-]{2,24}" required disabled={busy}/></label><p>{t('Recorde local')}: {record}</p><WallyTurnstile key={verification} onTokenChange={setToken} action="public-write"/><button type="submit" disabled={busy||!token}>{t('Enviar recorde')}</button></form>}
    {message&&<p role="status">{message}</p>}
  </section>;
}
