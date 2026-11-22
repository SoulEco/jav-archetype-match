const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});
const codeKey=code=>"CODE_"+String(code||"").trim().toUpperCase();
const validCode=code=>/^[A-Z0-9]{6}$/.test(String(code||"").trim().toUpperCase());
const adminOK=(password,env)=>!!env.ADMIN_PASSWORD && password===env.ADMIN_PASSWORD;

export async function onRequestPost({request,env}) {
  try{
    const {password,code}=await request.json();
    if(!adminOK(password,env)) return json({error:"管理员密码错误"},401);
    if(code){
      if(!validCode(code)) return json({error:"授权码格式错误"},400);
      const data=await env.MY_KV.get(codeKey(code),{type:"json"});
      if(!data) return json({error:"未找到该授权码"},404);
      const max=Number(data.max_attempts)||0,used=Number(data.used_attempts)||0;
      return json({success:true,type:"single",data:{code:String(code).toUpperCase(),max,used,remaining:Math.max(0,max-used),created:data.created_at||"未知",results:data.results||[]}});
    }
    let cursor, list=[];
    do{
      const page=await env.MY_KV.list({prefix:"CODE_",limit:1000,cursor});
      for(const k of page.keys){const d=await env.MY_KV.get(k.name,{type:"json"});if(d){const max=Number(d.max_attempts)||0,used=Number(d.used_attempts)||0;list.push({code:k.name.slice(5),max,used,remaining:Math.max(0,max-used),created:d.created_at||"未知"})}}
      cursor=page.cursor;
    }while(cursor);
    list.sort((a,b)=>String(b.created).localeCompare(String(a.created)));
    return json({success:true,type:"all",list});
  }catch(e){return json({error:"服务器查询失败："+e.message},500)}
}
