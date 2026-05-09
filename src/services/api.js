import{APP_CONFIG}from'../config';
import{demoCards,demoCategories,demoMembers}from'../data/demoData';
import{storage}from'./storage';

function getToken(){return storage.get('session')?.token||''}

async function request(payload){
  if(APP_CONFIG.DEMO_MODE||!APP_CONFIG.GAS_WEB_APP_URL){
    await new Promise(r=>setTimeout(r,350));
    return{ok:true,session:{token:'demo-token',usuario:payload.usuario||'demo',nome:payload.usuario||'Demo'},demo:true};
  }
  const body=payload.action==='login'?payload:{...payload,token:getToken()};
  const res=await fetch(APP_CONFIG.GAS_WEB_APP_URL,{method:'POST',mode:'cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)});
  const d=await res.json();
  if(!d.ok)throw new Error(d.message||'Erro no Apps Script');
  return d;
}

async function get(action){
  if(APP_CONFIG.DEMO_MODE||!APP_CONFIG.GAS_WEB_APP_URL){
    await new Promise(r=>setTimeout(r,150));
    if(action==='categorias')return{ok:true,categorias:demoCategories};
    if(action==='cartoes')return{ok:true,cartoes:demoCards};
    if(action==='membros')return{ok:true,membros:demoMembers};
    return{ok:true};
  }
  const url=new URL(APP_CONFIG.GAS_WEB_APP_URL);
  url.searchParams.set('action',action);
  url.searchParams.set('token',getToken());
  const res=await fetch(url);
  const d=await res.json();
  if(!d.ok)throw new Error(d.message||'Erro no Apps Script');
  return d;
}

export const api={
  login:(usuario,senha)=>request({action:'login',usuario,senha}),
  getCategorias:()=>get('categorias'),
  getCartoes:()=>get('cartoes'),
  getMembros:()=>get('membros'),
  salvarLancamento:p=>request({action:'novoLancamento',...p}),
  criarCategoria:p=>request({action:'novaCategoria',...p}),
  criarMembro:p=>request({action:'novoMembro',...p}),
  salvarRecorrente:p=>request({action:'novaRecorrencia',...p})
};
