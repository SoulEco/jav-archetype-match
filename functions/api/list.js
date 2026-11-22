const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});
const codeKey=code=>"CODE_"+String(code||"").trim().toUpperCase();
const validCode=code=>/^[A-Z0-9]{6}$/.test(String(code||"").trim().toUpperCase());
const adminOK=(password,env)=>!!env.ADMIN_PASSWORD && password===env.ADMIN_PASSWORD;

export async function onRequestPost({request,env}) {
  try{
    const {password}=await request.json();
    if(!adminOK(password,env)) return json({error:"管理员密码错误"},401);
    let cursor,results=[];
    do{
      const page=await env.MY_KV.list({prefix:"CODE_",limit:1000,cursor});
      for(const k of page.keys){const d=await env.MY_KV.get(k.name,{type:"json"});if(d){const max=Number(d.max_attempts)||0,used=Number(d.used_attempts)||0;results.push({code:k.name.slice(5),max,used,remaining:Math.max(0,max-used),created:d.created_at||"未知"})}}
      cursor=page.cursor;
    }while(cursor);
    results.sort((a,b)=>String(b.created).localeCompare(String(a.created)));
    return json({success:true,list:results});
  }catch(e){return json({error:"读取数据库失败："+e.message},500)}
}
