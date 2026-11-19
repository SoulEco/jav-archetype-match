const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});
const codeKey=code=>"CODE_"+String(code||"").trim().toUpperCase();
const validCode=code=>/^[A-Z0-9]{6}$/.test(String(code||"").trim().toUpperCase());
const adminOK=(password,env)=>!!env.ADMIN_PASSWORD && password===env.ADMIN_PASSWORD;

export async function onRequestPost({request,env}) {
  try {
    const {password,count=10,attempts=1}=await request.json();
    if(!adminOK(password,env)) return json({error:"管理员密码错误"},401);
    const n=Number(count), a=Number(attempts);
    if(!Number.isInteger(n)||n<1||n>100) return json({error:"生成数量必须为1—100"},400);
    if(!Number.isInteger(a)||a<1||a>10) return json({error:"单码次数必须为1—10"},400);
    const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789", codes=[], maxTries=n*100;
    for(let tries=0;codes.length<n&&tries<maxTries;tries++){
      const bytes=new Uint8Array(6);crypto.getRandomValues(bytes);
      const code=Array.from(bytes,b=>chars[b%chars.length]).join("");
      const key=codeKey(code);if(await env.MY_KV.get(key))continue;
      const value={max_attempts:a,used_attempts:0,results:[],created_at:new Date().toISOString(),version:2};
      await env.MY_KV.put(key,JSON.stringify(value),{expirationTtl:2592000});
      codes.push({code,max:a,created:new Date().toLocaleString("zh-CN")});
    }
    if(codes.length!==n) return json({error:"未能生成足够数量的唯一授权码，请重试"},503);
    return json({success:true,codes});
  }catch(e){return json({error:"生成失败："+e.message},500)}
}
