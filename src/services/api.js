import { APP_CONFIG } from '../config';
import { demoCards, demoCategories, demoMembers } from '../data/demoData';
import { storage } from './storage';

function getToken() {
  return storage.get('session')?.token || '';
}

function demoGet(key, fallback = []) {
  return storage.get(`demo:${key}`, fallback);
}

function demoSet(key, value) {
  storage.set(`demo:${key}`, value);
  return value;
}

async function request(payload) {
  if (APP_CONFIG.DEMO_MODE || !APP_CONFIG.GAS_WEB_APP_URL) {
    await new Promise(r => setTimeout(r, 250));
    return handleDemoPost(payload);
  }

  const body = payload.action === 'login' ? payload : { ...payload, token: getToken() };
  const res = await fetch(APP_CONFIG.GAS_WEB_APP_URL, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body)
  });
  const d = await res.json();
  if (!d.ok) throw new Error(d.message || 'Erro no Apps Script');
  return d;
}

async function get(action) {
  if (APP_CONFIG.DEMO_MODE || !APP_CONFIG.GAS_WEB_APP_URL) {
    await new Promise(r => setTimeout(r, 150));
    if (action === 'categorias') return { ok: true, categorias: demoGet('categorias', demoCategories) };
    if (action === 'cartoes') return { ok: true, cartoes: demoGet('cartoes', demoCards) };
    if (action === 'membros') return { ok: true, membros: demoGet('membros', demoMembers) };
    if (action === 'recorrentes') return { ok: true, recorrentes: demoGet('recorrentes', []) };
    return { ok: true };
  }

  const url = new URL(APP_CONFIG.GAS_WEB_APP_URL);
  url.searchParams.set('action', action);
  url.searchParams.set('token', getToken());
  const res = await fetch(url);
  const d = await res.json();
  if (!d.ok) throw new Error(d.message || 'Erro no Apps Script');
  return d;
}

function handleDemoPost(payload) {
  if (payload.action === 'login') {
    return {
      ok: true,
      session: {
        token: 'demo-token',
        usuario: payload.usuario || 'demo',
        nome: payload.usuario || 'Demo'
      },
      demo: true
    };
  }

  if (payload.action === 'novaCategoria') {
    const item = {
      id: `CAT-${Date.now()}`,
      tipo: String(payload.tipo || 'GASTO').toUpperCase(),
      categoria: payload.categoria || '',
      subcategoria: payload.subcategoria || '',
      cor: payload.cor || '#16a34a',
      icone: payload.icone || 'CircleDollarSign',
      ativo: true
    };
    demoSet('categorias', [...demoGet('categorias', demoCategories), item]);
    return { ok: true, categoria: item };
  }

  if (payload.action === 'excluirCategoria') {
    const atual = demoGet('categorias', demoCategories).filter((x, idx) => String(x.id || `${x.tipo}|${x.categoria}|${x.subcategoria}|${idx}`) !== String(payload.id));
    demoSet('categorias', atual);
    return { ok: true };
  }

  if (payload.action === 'novoCartao') {
    const item = {
      id: `CAR-${Date.now()}`,
      nome: payload.nome || '',
      bandeira: payload.bandeira || '',
      banco: payload.banco || '',
      cor: payload.cor || '#111827',
      fechamento: Number(payload.fechamento || 1),
      vencimento: Number(payload.vencimento || 1),
      limite: Number(payload.limite || 0),
      ativo: true
    };
    demoSet('cartoes', [...demoGet('cartoes', demoCards), item]);
    return { ok: true, cartao: item };
  }

  if (payload.action === 'excluirCartao') {
    demoSet('cartoes', demoGet('cartoes', demoCards).filter((x, idx) => String(x.id || x.nome || idx) !== String(payload.id)));
    return { ok: true };
  }

  if (payload.action === 'novoMembro') {
    const item = {
      id: `MEM-${Date.now()}`,
      nome: payload.nome || '',
      apelido: payload.apelido || payload.nome || '',
      cor: payload.cor || '#2FA4DC',
      ativo: true
    };
    demoSet('membros', [...demoGet('membros', demoMembers), item]);
    return { ok: true, membro: item };
  }

  if (payload.action === 'excluirMembro') {
    demoSet('membros', demoGet('membros', demoMembers).filter((x, idx) => String(x.id || x.nome || idx) !== String(payload.id)));
    return { ok: true };
  }

  if (payload.action === 'novaRecorrencia') {
    const item = {
      recorrenteId: `REC-${Date.now()}`,
      tipo: payload.tipo || 'GASTO',
      descricao: payload.descricao || '',
      frequencia: payload.frequencia || 'Mensal',
      valor: Number(payload.valor || 0),
      categoria: payload.categoria || '',
      subcategoria: payload.subcategoria || '',
      formaPagamento: payload.formaPagamento || '',
      cartao: payload.cartao || '',
      contaOrigem: payload.contaOrigem || '',
      contaDestino: payload.contaDestino || '',
      conta: payload.conta || '',
      membro: payload.membro || '',
      tags: payload.tags || '',
      observacoes: payload.observacoes || '',
      proximaData: payload.data || payload.proximaData || '',
      fim: payload.fimRecorrencia || payload.fim || '',
      ativo: true
    };
    demoSet('recorrentes', [...demoGet('recorrentes', []), item]);
    return { ok: true, recorrenteId: item.recorrenteId };
  }

  if (payload.action === 'excluirRecorrencia') {
    demoSet('recorrentes', demoGet('recorrentes', []).filter(x => x.recorrenteId !== payload.recorrenteId));
    return { ok: true };
  }

  if (payload.action === 'novoLancamento') {
    return { ok: true, ids: [`LAN-${Date.now()}`], total: 1 };
  }

  return { ok: true };
}

export const api = {
  login: (usuario, senha) => request({ action: 'login', usuario, senha }),

  getCategorias: () => get('categorias'),
  criarCategoria: p => request({ action: 'novaCategoria', ...p }),
  excluirCategoria: id => request({ action: 'excluirCategoria', id }),

  getCartoes: () => get('cartoes'),
  criarCartao: p => request({ action: 'novoCartao', ...p }),
  excluirCartao: id => request({ action: 'excluirCartao', id }),

  getMembros: () => get('membros'),
  criarMembro: p => request({ action: 'novoMembro', ...p }),
  excluirMembro: id => request({ action: 'excluirMembro', id }),

  getRecorrentes: () => get('recorrentes'),
  salvarRecorrente: p => request({ action: 'novaRecorrencia', ...p }),
  excluirRecorrente: recorrenteId => request({ action: 'excluirRecorrencia', recorrenteId }),

  salvarLancamento: p => request({ action: 'novoLancamento', ...p })
};
