const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});
const codeKey=code=>"CODE_"+String(code||"").trim().toUpperCase();
const validCode=code=>/^[A-Z0-9]{6}$/.test(String(code||"").trim().toUpperCase());
const adminOK=(password,env)=>!!env.ADMIN_PASSWORD && password===env.ADMIN_PASSWORD;

export async function onRequestPost({request,env}) {
  try{
    const {code,gen,resultData}=await request.json();
    if(!validCode(code)) return json({error:"授权码格式错误"},400);
    if(!/^gen[1-5]$/.test(String(gen))) return json({error:"测试代际无效"},400);
    if(!resultData||typeof resultData!=="object"||Array.isArray(resultData)) return json({error:"测试结果格式错误"},400);
    const key=codeKey(code),data=await env.MY_KV.get(key,{type:"json"});
    if(!data) return json({error:"授权码不存在或已过期"},404);
    const max=Number(data.max_attempts)||0,used=Number(data.used_attempts)||0;
    if(used>=max) return json({error:"测试次数已用完"},403);
    let results=Array.isArray(data.results)?data.results:[];
    if(data.results&&typeof data.results==="object"&&!Array.isArray(data.results)){
      results=Object.entries(data.results).map(([g,result])=>({gen:g,result,timestamp:data.created_at||null}));
    }
    const record={gen,result:resultData,timestamp:new Date().toISOString()};
    results.push(record);
    if(results.length>max) results=results.slice(-max);
    data.results=results;data.used_attempts=used+1;data.version=2;
    await env.MY_KV.put(key,JSON.stringify(data));
    return json({success:true,remaining:Math.max(0,max-data.used_attempts),result:resultData});
  }catch(e){return json({error:"保存失败："+e.message},500)}
}
