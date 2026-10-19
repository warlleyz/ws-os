const{test}=require('node:test');const assert=require('node:assert/strict');
test('rankings permanecem desligados sem consumir serviços externos',async()=>{const api=await import('../../functions/api/rankings.js');const response=await api.onRequest({request:new Request('https://test/api/rankings',{method:'POST'}),env:{}});assert.equal(response.status,503);assert.equal((await response.json()).error,'RANKINGS_DISABLED');});
test('validação de rankings respeita jogos, limites e apelidos públicos',async()=>{const{validateScore}=await import('../../functions/api/rankings.js');for(const input of [{game:'snake',score:223,alias:'Teste'},{game:'flappy',score:Infinity,alias:'Teste'},{game:'mines',score:1,alias:'Teste'},{game:'snake',score:2,alias:'<script>'},{game:'snake',score:2,alias:'email@example.com'}])assert.throws(()=>validateScore(input));assert.equal(validateScore({game:'snake',score:222,alias:'Jogador'}).score,222);});
test('corpo público é limitado por stream e falha sem proteção configurada',async()=>{const{readBoundedJson,protectPublicWrite}=await import('../../functions/_lib/publicWriteProtection.js');await assert.rejects(readBoundedJson(new Request('https://test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'x'.repeat(9000)})})),/BODY_TOO_LARGE/);await assert.rejects(protectPublicWrite(new Request('https://test'),{},'token','rankings'),/PROTECTION_UNAVAILABLE/);});
test('proteção pública limita antes do verificador e rejeita origem incompatível',async()=>{const{protectPublicWrite}=await import('../../functions/_lib/publicWriteProtection.js');const env={WALLY_LIMITS_DB:{prepare(){return{bind(){return{first:async()=>null}}}}},PUBLIC_WRITE_HASH_SALT:'test-salt',TURNSTILE_SECRET_KEY:'test-secret'};const request=new Request('https://test/api/rankings',{headers:{'CF-Connecting-IP':'192.0.2.1'}});await assert.rejects(protectPublicWrite(request,env,'token','rankings'),/RATE_LIMITED/);await assert.rejects(protectPublicWrite(new Request('https://test',{headers:{Origin:'https://other.test','CF-Connecting-IP':'192.0.2.1'}}),env,'token','rankings'),/INVALID_ORIGIN/);});

test('atualizar ranking após envio não cancela a própria operação nem mantém formulário bloqueado',async()=>{
 const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');const {transformWithOxc}=await import('vite');
 const source=fs.readFileSync(path.join(__dirname,'../../src/apps/games/GameRankings.jsx'),'utf8').replaceAll("import.meta.env.VITE_RANKINGS_ENABLED","'true'");
 const {code}=await transformWithOxc(source,'GameRankings.jsx',{jsx:{runtime:'classic'}});
 let cursor=0,tree;const slots=[];
 const React={createElement:(type,props,...children)=>({type,props:{...props,children}}),useState:initial=>{const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];},useRef:value=>slots[cursor++]??={current:value},useEffect:()=>{}};
 const signals=[];
 const Component=vm.runInNewContext(code.replace(/^import[\s\S]*?;\s*$/gm,'').replace('export default function','function')+';GameRankings',{React,...React,useLocale:()=>{},t:value=>value,WallyTurnstile:'Verification',AbortController,useGameRecord:()=>({record:5}),fetch:async(_url,options)=>{signals.push(options.signal);return Response.json(options.method==='POST'?{accepted:true}:{scores:[{alias:'Player',score:5}]});}});
 const render=()=>{cursor=0;tree=Component({game:'snake'});};
 const nodes=value=>Array.isArray(value)?value.flatMap(nodes):value&&typeof value==='object'?[value,...nodes(value.props.children)]:[];
 render();nodes(tree).find(n=>n.type==='Verification').props.onTokenChange('token');render();
 await nodes(tree).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});render();
 assert.equal(signals.length,2);assert.equal(signals[0].aborted,false);assert.equal(nodes(tree).find(n=>n.type==='input').props.disabled,false);
});
