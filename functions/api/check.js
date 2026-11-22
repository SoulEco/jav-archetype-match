const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});
const codeKey=code=>"CODE_"+String(code||"").trim().toUpperCase();
const validCode=code=>/^[A-Z0-9]{6}$/.test(String(code||"").trim().toUpperCase());
const adminOK=(password,env)=>!!env.ADMIN_PASSWORD && password===env.ADMIN_PASSWORD;

export async function onRequestPost({request,env}) {
  try {
    const {code}=await request.json();
    if(!validCode(code)) return json({error:"请输入6位授权码"},400);
    const data=await env.MY_KV.get(codeKey(code),{type:"json"});
    if(!data) return json({error:"授权码不存在或已过期"},404);
    const max=Math.max(0,Number(data.max_attempts)||0), used=Math.max(0,Number(data.used_attempts)||0);
    const results=Array.isArray(data.results)?data.results:(data.results&&typeof data.results==="object"?Object.entries(data.results).map(([gen,result])=>({gen,result,timestamp:data.created_at||null})):[]);
    return json({valid:true,remaining:Math.max(0,max-used),has_result:results.length>0,results});
  } catch(e){return json({error:"请求格式错误"},400)}
}
