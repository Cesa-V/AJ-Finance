import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from './utils/icons.jsx';
import { api } from './services/api';
import { storage } from './services/storage';
import { APP_CONFIG } from './config';
import { buildFaturas, currencyToNumber, formatCurrencyInput, todayISO } from './utils/format';

const initialLaunch = {
  tipo: 'GASTO',
  valor: '',
  descricao: '',
  categoria: '',
  subcategoria: '',
  formaPagamento: 'Pix',
  condicao: 'À vista',
  parcelas: 1,
  cartao: '',
  fatura: buildFaturas()[0],
  conta: '',
  contaOrigem: '',
  contaDestino: '',
  data: todayISO(),
  membro: '',
  tags: '',
  observacoes: '',
  status: 'PAGO',
  recorrente: false,
  frequencia: 'Mensal',
  fimRecorrencia: ''
};

const tipoLabels = { GASTO: 'Gasto', GANHO: 'Ganho', TRANSFERENCIA: 'Transferência' };
const tipos = ['GASTO', 'GANHO', 'TRANSFERENCIA'];
const frequencias = ['Diário', 'Semanal', 'Quinzenal', 'Mensal', 'Trimestral', 'Semestral', 'Anual'];
const iconOptions = ['Home', 'Shirt', 'Bus', 'Umbrella', 'CircleDollarSign', 'ArrowLeftRight', 'Plane', 'Star', 'Utensils', 'Bell', 'CircleAlert', 'GraduationCap', 'Briefcase', 'PawPrint', 'HeartPulse', 'Wrench', 'Wallet'];

function getItemId(item, fallback = '') {
  return String(item.id || item.recorrenteId || item.nome || `${item.tipo || ''}|${item.categoria || ''}|${item.subcategoria || ''}|${fallback}`);
}

function brlToNumber(value) {
  if (typeof value === 'number') return value;
  return currencyToNumber(value);
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className="fixed left-4 right-4 top-4 z-[90] fade-enter">
      <div className={`mx-auto max-w-md rounded-3xl px-5 py-4 text-white shadow-soft ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-600'}`}>
        <div className="flex items-center justify-between gap-4">
          <span className="font-medium">{toast.message}</span>
          <button onClick={onClose} className="rounded-full bg-white/20 p-1"><Icon name="X" size={18} /></button>
        </div>
      </div>
    </div>
  );
}

function Label({ text, children }) {
  return <label className="mt-4 block first:mt-0"><span className="text-sm font-semibold text-slate-600">{text}</span>{children}</label>;
}

function Header({ title, subtitle, back }) {
  return (
    <header className="mb-5 flex items-center gap-3">
      {back && <button onClick={back} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm"><Icon name="ChevronLeft" /></button>}
      <div className="min-w-0">
        <h1 className="text-2xl font-black tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
    </header>
  );
}

function Login({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      const d = await api.login(usuario, senha);
      storage.set('session', d.session);
      onLogin(d.session);
    } catch (err) {
      setErro(err.message || 'Usuário ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-green-50 px-6 py-10">
      <div className="mx-auto flex min-h-[85vh] max-w-md flex-col justify-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-green-600 to-green-400 text-4xl font-black text-white shadow-soft">AJ</div>
        <div className="mt-8 text-center">
          <h1 className="text-3xl font-black tracking-tight">AJ Finance</h1>
          <p className="mt-2 text-slate-500">Seu controle financeiro em poucos toques.</p>
        </div>
        <form onSubmit={submit} className="mt-10 rounded-[2rem] bg-white p-5 shadow-soft">
          <Label text="Usuário"><input value={usuario} onChange={e => setUsuario(e.target.value)} className="field" placeholder="vto" autoCapitalize="none" /></Label>
          <Label text="Senha"><input value={senha} onChange={e => setSenha(e.target.value)} type="password" className="field" placeholder="••••••" /></Label>
          {erro && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{erro}</p>}
          <button disabled={loading} className="btn-primary mt-6 w-full">{loading ? 'Entrando...' : 'Entrar'}</button>
          {APP_CONFIG.DEMO_MODE && <p className="mt-4 text-center text-xs text-slate-400">Modo demo ativo: qualquer login entra.</p>}
        </form>
      </div>
    </main>
  );
}

function BottomNav({ page, setPage, onPlus }) {
  return (
    <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-slate-100 bg-white/95 px-6 py-3 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-3 items-center">
        <button onClick={() => setPage('home')} className={`flex flex-col items-center gap-1 text-xs font-semibold ${page === 'home' ? 'text-green-700' : 'text-slate-400'}`}><Icon name="House" />Início</button>
        <button onClick={onPlus} className="-mt-8 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-white shadow-xl shadow-green-500/30 active:scale-95"><Icon name="Plus" size={34} /></button>
        <button onClick={() => setPage('settings')} className={`flex flex-col items-center gap-1 text-xs font-semibold ${page === 'settings' ? 'text-green-700' : 'text-slate-400'}`}><Icon name="Settings" />Ajustes</button>
      </div>
    </nav>
  );
}

function Home({ session, onLaunch, setPage }) {
  return (
    <main className="mx-auto max-w-md px-5 pb-28 pt-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Olá,</p>
          <h1 className="text-2xl font-black">{session?.nome || 'AJ'}</h1>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600 font-black text-white">AJ</div>
      </header>

      <section className="mt-6 rounded-[2rem] bg-gradient-to-br from-green-600 to-green-400 p-6 text-white shadow-soft">
        <p className="text-sm opacity-80">Resumo rápido</p>
        <p className="mt-2 text-3xl font-black">Controle em dia</p>
        <p className="mt-3 text-sm opacity-90">Use o botão central para lançar gastos, ganhos ou transferências.</p>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <HomeCard icon="Plus" title="Novo lançamento" desc="Gasto, ganho ou transferência" onClick={onLaunch} />
        <HomeCard icon="Settings" title="Ajustes" desc="Categorias, cartões e membros" onClick={() => setPage('settings')} />
      </section>

      <section className="mt-5 rounded-[2rem] bg-white p-5 shadow-soft">
        <h2 className="text-lg font-black">Gestão do app</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-500">
          <p>• Recorrentes em Ajustes</p>
          <p>• Categorias e subcategorias dinâmicas</p>
          <p>• Cartões e membros cadastráveis</p>
        </div>
      </section>
    </main>
  );
}

function HomeCard({ icon, title, desc, onClick }) {
  return <button onClick={onClick} className="rounded-[1.6rem] bg-white p-5 text-left shadow-soft"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700"><Icon name={icon} /></div><p className="font-bold">{title}</p><p className="mt-1 text-xs text-slate-400">{desc}</p></button>;
}

function Settings({ setPage, onLogout }) {
  const items = [
    ['admin:recorrentes', 'Recorrentes', 'Repeat', 'Visualizar, lançar e excluir recorrências'],
    ['admin:categorias', 'Categorias', 'CircleDollarSign', 'Visualizar, lançar e excluir categorias'],
    ['admin:cartoes', 'Cartões', 'CreditCard', 'Visualizar, lançar e excluir cartões'],
    ['admin:membros', 'Membros', 'User', 'Visualizar, lançar e excluir membros']
  ];
  return (
    <main className="mx-auto max-w-md px-5 pb-28 pt-6">
      <Header title="Ajustes" subtitle="Cadastros auxiliares do AJ Finance." />
      <div className="space-y-3">
        {items.map(([page, title, icon, desc]) => (
          <button key={page} onClick={() => setPage(page)} className="flex w-full items-center gap-4 rounded-[1.6rem] bg-white p-4 text-left shadow-soft">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700"><Icon name={icon} /></div>
            <div className="min-w-0 flex-1"><p className="font-black">{title}</p><p className="text-sm text-slate-400">{desc}</p></div>
            <Icon name="ChevronLeft" className="rotate-180 text-slate-300" />
          </button>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {APP_CONFIG.GOOGLE_SHEET_URL && <a href={APP_CONFIG.GOOGLE_SHEET_URL} target="_blank" rel="noreferrer" className="flex w-full items-center gap-4 rounded-[1.6rem] bg-white p-4 text-left shadow-soft"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Icon name="Table2" /></div><div><p className="font-black">Abrir planilha</p><p className="text-sm text-slate-400">Google Sheets</p></div></a>}
        <button onClick={onLogout} className="flex w-full items-center gap-4 rounded-[1.6rem] bg-white p-4 text-left shadow-soft"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600"><Icon name="LogOut" /></div><div><p className="font-black">Sair</p><p className="text-sm text-slate-400">Encerrar sessão local</p></div></button>
      </div>
    </main>
  );
}

function Modal({ children, onClose, full = false }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-sm fade-enter">
      <div className={`sheet-enter fixed bottom-0 left-0 right-0 mx-auto ${full ? 'top-0 max-w-md overflow-auto rounded-none' : 'max-w-md rounded-t-[2rem]'} bg-white p-5 shadow-soft`}>
        <div className="mb-4 flex justify-end"><button onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-500"><Icon name="X" size={20} /></button></div>
        {children}
      </div>
    </div>
  );
}

function Segment({ options, value, onChange }) {
  return <div className="grid grid-cols-2 rounded-full bg-slate-100 p-1">{options.map(o => <button key={o} onClick={() => onChange(o)} type="button" className={`rounded-full px-4 py-2 text-sm font-bold transition ${value === o ? 'bg-white text-green-700 shadow-sm' : 'text-slate-400'}`}>{o}</button>)}</div>;
}

function TypeTabs({ value, onChange }) {
  return <div className="grid grid-cols-3 rounded-2xl bg-slate-100 p-1">{tipos.map(t => <button key={t} onClick={() => onChange(t)} type="button" className={`rounded-xl px-2 py-2 text-xs font-black transition ${value === t ? 'bg-white text-green-700 shadow-sm' : 'text-slate-400'}`}>{tipoLabels[t]}</button>)}</div>;
}

function CategoryPicker({ type, categories, value, onSelect, onClose }) {
  const [selected, setSelected] = useState(null);
  const [q, setQ] = useState('');
  const grouped = useMemo(() => {
    const m = new Map();
    categories.filter(c => c.tipo === type && c.ativo !== false).forEach(c => {
      if (!m.has(c.categoria)) m.set(c.categoria, { ...c, subcategorias: [] });
      if (c.subcategoria) m.get(c.categoria).subcategorias.push(c.subcategoria);
    });
    return [...m.values()].filter(c => c.categoria.toLowerCase().includes(q.toLowerCase()));
  }, [categories, q, type]);

  if (selected) {
    return <Modal full onClose={onClose}>
      <button onClick={() => setSelected(null)} className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-500"><Icon name="ChevronLeft" size={18} />Voltar</button>
      <div className="flex items-center gap-3">
        <div style={{ backgroundColor: selected.cor }} className="flex h-14 w-14 items-center justify-center rounded-2xl text-white"><Icon name={selected.icone} /></div>
        <div><h2 className="text-2xl font-black">{selected.categoria}</h2><p className="text-sm text-slate-400">Escolha uma subcategoria.</p></div>
      </div>
      <button onClick={() => onSelect({ categoria: selected.categoria, subcategoria: '' })} className="mt-5 w-full rounded-2xl border border-green-100 bg-green-50 px-4 py-4 font-bold text-green-700">Aplicar só {selected.categoria}</button>
      <div className="mt-5 grid grid-cols-2 gap-3">{selected.subcategorias.map(s => <button key={s} onClick={() => onSelect({ categoria: selected.categoria, subcategoria: s })} className="rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-sm"><p className="font-bold">{s}</p></button>)}</div>
    </Modal>;
  }

  return <Modal full onClose={onClose}>
    <h2 className="text-2xl font-black">Categoria</h2>
    <p className="mt-1 text-sm text-slate-400">Selecione uma categoria principal.</p>
    <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3"><Icon name="Search" size={18} className="text-slate-400" /><input value={q} onChange={e => setQ(e.target.value)} className="w-full bg-transparent outline-none" placeholder="Buscar categoria..." /></div>
    <div className="mt-5 grid grid-cols-2 gap-3">{grouped.map(c => <button key={c.categoria} onClick={() => c.subcategorias.length ? setSelected(c) : onSelect({ categoria: c.categoria, subcategoria: '' })} className="rounded-[1.5rem] border border-slate-100 bg-white p-4 text-left shadow-sm"><div style={{ backgroundColor: c.cor }} className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-white"><Icon name={c.icone} /></div><p className="font-bold">{c.categoria}</p><p className="mt-1 text-xs text-slate-400">{c.subcategorias.length ? `${c.subcategorias.length} opções` : 'Sem subcategoria'}</p></button>)}</div>
    {!grouped.length && <p className="mt-8 text-center text-sm text-slate-400">Nenhuma categoria encontrada.</p>}
  </Modal>;
}

function LaunchModal({ onClose, categories, cards, members, onNotify }) {
  const [form, setForm] = useState({ ...initialLaunch, cartao: cards[0]?.nome || '' });
  const [picker, setPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const faturas = buildFaturas();

  function patch(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    if (!brlToNumber(form.valor)) return onNotify('Informe um valor válido.', 'error');
    if (!form.descricao) return onNotify('Informe uma descrição.', 'error');
    setLoading(true);
    try {
      await api.salvarLancamento({ ...form, valor: brlToNumber(form.valor) });
      onNotify('Lançamento registrado.');
      onClose();
    } catch (err) {
      onNotify(err.message || 'Erro ao registrar.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return <Modal full onClose={onClose}>
    <h2 className="text-2xl font-black">Novo lançamento</h2>
    <p className="mt-1 text-sm text-slate-400">Gasto, ganho ou transferência.</p>
    <form onSubmit={submit} className="mt-5 pb-10">
      <TypeTabs value={form.tipo} onChange={tipo => setForm({ ...initialLaunch, tipo, cartao: cards[0]?.nome || '' })} />
      <Label text="Valor"><input value={form.valor} onChange={e => patch('valor', formatCurrencyInput(e.target.value))} className="field text-2xl font-black" placeholder="R$ 0,00" /></Label>
      <Label text="Descrição"><input value={form.descricao} onChange={e => patch('descricao', e.target.value)} className="field" placeholder="Ex: mercado, salário, pix..." /></Label>
      {form.tipo !== 'TRANSFERENCIA' && <div className="mt-4"><span className="text-sm font-semibold text-slate-600">Categoria</span><button type="button" onClick={() => setPicker(true)} className="mt-2 flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-left"><span className={form.categoria ? 'font-bold text-slate-800' : 'text-slate-400'}>{form.categoria ? `${form.categoria}${form.subcategoria ? ` > ${form.subcategoria}` : ''}` : 'Selecionar categoria'}</span><Icon name="ChevronLeft" className="rotate-180 text-slate-300" /></button></div>}
      {form.tipo === 'GASTO' && <>
        <Label text="Forma de pagamento"><select value={form.formaPagamento} onChange={e => patch('formaPagamento', e.target.value)} className="field"><option>Crédito</option><option>Débito</option><option>Pix</option><option>Dinheiro</option></select></Label>
        <Label text="Condição"><Segment options={['À vista', 'Parcelado']} value={form.condicao} onChange={v => patch('condicao', v)} /></Label>
        {form.condicao === 'Parcelado' && <Label text="Número de parcelas"><input type="number" min="2" value={form.parcelas} onChange={e => patch('parcelas', e.target.value)} className="field" /></Label>}
        {form.formaPagamento === 'Crédito' && <>
          <Label text="Cartão"><select value={form.cartao} onChange={e => patch('cartao', e.target.value)} className="field">{cards.filter(c => c.ativo !== false).map(c => <option key={c.nome}>{c.nome}</option>)}</select></Label>
          <Label text="Fatura"><select value={form.fatura} onChange={e => patch('fatura', e.target.value)} className="field">{faturas.map(f => <option key={f}>{f}</option>)}</select></Label>
        </>}
      </>}
      {form.tipo === 'GANHO' && <Label text="Conta"><input value={form.conta} onChange={e => patch('conta', e.target.value)} className="field" placeholder="Conta de recebimento" /></Label>}
      {form.tipo === 'TRANSFERENCIA' && <>
        <Label text="Conta origem"><input value={form.contaOrigem} onChange={e => patch('contaOrigem', e.target.value)} className="field" /></Label>
        <Label text="Conta destino"><input value={form.contaDestino} onChange={e => patch('contaDestino', e.target.value)} className="field" /></Label>
      </>}
      <Label text="Data"><input type="date" value={form.data} onChange={e => patch('data', e.target.value)} className="field" /></Label>
      <Label text="Membro"><select value={form.membro} onChange={e => patch('membro', e.target.value)} className="field"><option value="">Sem membro</option>{members.filter(m => m.ativo !== false).map(m => <option key={m.nome} value={m.nome}>{m.apelido || m.nome}</option>)}</select></Label>
      <Label text="Tags"><input value={form.tags} onChange={e => patch('tags', e.target.value)} className="field" placeholder="Ex: viagem, casa" /></Label>
      <Label text="Observações"><textarea value={form.observacoes} onChange={e => patch('observacoes', e.target.value)} className="field min-h-24" /></Label>
      <Label text="Recorrente?"><div className="mt-2 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"><span className="font-semibold text-slate-600">Criar recorrência junto</span><input type="checkbox" checked={form.recorrente} onChange={e => patch('recorrente', e.target.checked)} className="h-6 w-6 accent-green-600" /></div></Label>
      {form.recorrente && <div className="mt-4 rounded-3xl bg-green-50 p-4"><Label text="Frequência"><select value={form.frequencia} onChange={e => patch('frequencia', e.target.value)} className="field bg-white">{frequencias.map(x => <option key={x}>{x}</option>)}</select></Label><Label text="Fim da recorrência opcional"><input type="date" value={form.fimRecorrencia} onChange={e => patch('fimRecorrencia', e.target.value)} className="field bg-white" /></Label></div>}
      <button disabled={loading} className="btn-primary mt-6 w-full">{loading ? 'Registrando...' : `Registrar ${tipoLabels[form.tipo].toLowerCase()}`}</button>
    </form>
    {picker && <CategoryPicker type={form.tipo} categories={categories} onClose={() => setPicker(false)} onSelect={x => { setForm(prev => ({ ...prev, ...x })); setPicker(false); }} />}
  </Modal>;
}

function AdminPage({ kind, data, categories, cards, members, setCategories, setCards, setMembers, setRecorrentes, onBack, onNotify }) {
  const isCat = kind === 'categorias';
  const isCard = kind === 'cartoes';
  const isMember = kind === 'membros';
  const isRec = kind === 'recorrentes';
  const title = isCat ? 'Categorias' : isCard ? 'Cartões' : isMember ? 'Membros' : 'Recorrentes';
  const [showForm, setShowForm] = useState(false);

  async function remove(item, idx) {
    const msg = `Excluir ${title.slice(0, -1).toLowerCase()}?`;
    if (!confirm(msg)) return;
    try {
      if (isCat) {
        const id = getItemId(item, idx);
        await api.excluirCategoria(id);
        setCategories(prev => prev.filter((x, i) => getItemId(x, i) !== id));
      } else if (isCard) {
        const id = getItemId(item, idx);
        await api.excluirCartao(id);
        setCards(prev => prev.filter((x, i) => getItemId(x, i) !== id));
      } else if (isMember) {
        const id = getItemId(item, idx);
        await api.excluirMembro(id);
        setMembers(prev => prev.filter((x, i) => getItemId(x, i) !== id));
      } else {
        await api.excluirRecorrente(item.recorrenteId);
        setRecorrentes(prev => prev.filter(x => x.recorrenteId !== item.recorrenteId));
      }
      onNotify('Registro excluído.');
    } catch (err) {
      onNotify(err.message || 'Erro ao excluir.', 'error');
    }
  }

  return (
    <main className="mx-auto max-w-md px-5 pb-28 pt-6">
      <Header title={title} subtitle="Visualize, lance novos registros ou exclua o que não usa mais." back={onBack} />
      <button onClick={() => setShowForm(true)} className="btn-primary mb-5 w-full">+ Lançar novo</button>
      <div className="space-y-3">
        {data.length === 0 && <div className="card text-center text-sm text-slate-400">Nenhum registro encontrado.</div>}
        {data.map((item, idx) => <AdminRow key={getItemId(item, idx)} item={item} kind={kind} onDelete={() => remove(item, idx)} />)}
      </div>
      {showForm && <AdminForm kind={kind} categories={categories} cards={cards} members={members} onClose={() => setShowForm(false)} onCreated={(item) => {
        if (isCat) setCategories(prev => [...prev, item]);
        if (isCard) setCards(prev => [...prev, item]);
        if (isMember) setMembers(prev => [...prev, item]);
        if (isRec) setRecorrentes(prev => [...prev, item]);
        setShowForm(false);
        onNotify('Registro criado.');
      }} onNotify={onNotify} />}
    </main>
  );
}

function AdminRow({ item, kind, onDelete }) {
  let title = '';
  let subtitle = '';
  let color = '#16a34a';
  let icon = 'CircleDollarSign';

  if (kind === 'categorias') {
    title = item.categoria || 'Sem categoria';
    subtitle = `${item.tipo || ''}${item.subcategoria ? ` • ${item.subcategoria}` : ' • apenas categoria'}`;
    color = item.cor || color;
    icon = item.icone || icon;
  } else if (kind === 'cartoes') {
    title = item.nome || 'Cartão';
    subtitle = `${item.banco || ''}${item.bandeira ? ` • ${item.bandeira}` : ''} • fecha ${item.fechamento || '-'} • vence ${item.vencimento || '-'}`;
    color = item.cor || '#111827';
    icon = 'CreditCard';
  } else if (kind === 'membros') {
    title = item.apelido || item.nome || 'Membro';
    subtitle = item.nome || '';
    color = item.cor || '#2FA4DC';
    icon = 'User';
  } else {
    title = item.descricao || 'Recorrência';
    subtitle = `${item.tipo || ''} • ${item.frequencia || ''} • ${Number(item.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    color = item.tipo === 'GANHO' ? '#16a34a' : item.tipo === 'TRANSFERENCIA' ? '#2563eb' : '#dc2626';
    icon = 'Repeat';
  }

  return <div className="flex items-center gap-4 rounded-[1.5rem] bg-white p-4 shadow-sm">
    <div style={{ backgroundColor: color }} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"><Icon name={icon} /></div>
    <div className="min-w-0 flex-1"><p className="truncate font-black">{title}</p><p className="truncate text-sm text-slate-400">{subtitle}</p></div>
    <button onClick={onDelete} className="rounded-2xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600">Excluir</button>
  </div>;
}

function AdminForm({ kind, categories, cards, members, onClose, onCreated, onNotify }) {
  const [form, setForm] = useState(defaultAdminForm(kind, cards));
  const [picker, setPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const isCat = kind === 'categorias';
  const isCard = kind === 'cartoes';
  const isMember = kind === 'membros';
  const isRec = kind === 'recorrentes';

  function patch(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      let created;
      if (isCat) {
        if (!form.categoria) throw new Error('Informe a categoria.');
        const res = await api.criarCategoria(form);
        created = res.categoria || { ...form, ativo: true };
      } else if (isCard) {
        if (!form.nome) throw new Error('Informe o nome do cartão.');
        const res = await api.criarCartao(form);
        created = res.cartao || { ...form, ativo: true };
      } else if (isMember) {
        if (!form.nome) throw new Error('Informe o nome do membro.');
        const res = await api.criarMembro(form);
        created = res.membro || { ...form, ativo: true };
      } else {
        if (!form.descricao) throw new Error('Informe a descrição.');
        if (!brlToNumber(form.valor)) throw new Error('Informe o valor.');
        const payload = { ...form, valor: brlToNumber(form.valor) };
        const res = await api.salvarRecorrente(payload);
        created = { ...payload, recorrenteId: res.recorrenteId || `REC-${Date.now()}`, proximaData: payload.data, fim: payload.fimRecorrencia, ativo: true };
      }
      onCreated(created);
    } catch (err) {
      onNotify(err.message || 'Erro ao criar.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return <Modal full onClose={onClose}>
    <h2 className="text-2xl font-black">Novo registro</h2>
    <p className="mt-1 text-sm text-slate-400">Preencha os dados e salve na planilha.</p>
    <form onSubmit={submit} className="mt-5 pb-10">
      {isCat && <>
        <Label text="Tipo"><select value={form.tipo} onChange={e => patch('tipo', e.target.value)} className="field">{tipos.map(t => <option key={t} value={t}>{tipoLabels[t]}</option>)}</select></Label>
        <Label text="Categoria"><input value={form.categoria} onChange={e => patch('categoria', e.target.value)} className="field" placeholder="Ex: Alimentação" /></Label>
        <Label text="Subcategoria opcional"><input value={form.subcategoria} onChange={e => patch('subcategoria', e.target.value)} className="field" placeholder="Ex: Restaurante" /></Label>
        <Label text="Cor"><input value={form.cor} onChange={e => patch('cor', e.target.value)} type="color" className="field h-14" /></Label>
        <Label text="Ícone"><select value={form.icone} onChange={e => patch('icone', e.target.value)} className="field">{iconOptions.map(i => <option key={i}>{i}</option>)}</select></Label>
      </>}

      {isCard && <>
        <Label text="Nome do cartão"><input value={form.nome} onChange={e => patch('nome', e.target.value)} className="field" placeholder="Ex: Nubank" /></Label>
        <Label text="Bandeira"><input value={form.bandeira} onChange={e => patch('bandeira', e.target.value)} className="field" placeholder="Visa, Mastercard..." /></Label>
        <Label text="Banco"><input value={form.banco} onChange={e => patch('banco', e.target.value)} className="field" placeholder="Ex: Nubank" /></Label>
        <Label text="Cor"><input value={form.cor} onChange={e => patch('cor', e.target.value)} type="color" className="field h-14" /></Label>
        <Label text="Dia de fechamento"><input type="number" min="1" max="31" value={form.fechamento} onChange={e => patch('fechamento', e.target.value)} className="field" /></Label>
        <Label text="Dia de vencimento"><input type="number" min="1" max="31" value={form.vencimento} onChange={e => patch('vencimento', e.target.value)} className="field" /></Label>
        <Label text="Limite opcional"><input value={form.limite} onChange={e => patch('limite', e.target.value)} className="field" placeholder="0" /></Label>
      </>}

      {isMember && <>
        <Label text="Nome"><input value={form.nome} onChange={e => patch('nome', e.target.value)} className="field" placeholder="Nome completo" /></Label>
        <Label text="Apelido"><input value={form.apelido} onChange={e => patch('apelido', e.target.value)} className="field" placeholder="Como aparecerá no app" /></Label>
        <Label text="Cor"><input value={form.cor} onChange={e => patch('cor', e.target.value)} type="color" className="field h-14" /></Label>
      </>}

      {isRec && <>
        <TypeTabs value={form.tipo} onChange={tipo => setForm(defaultAdminForm(kind, cards, tipo))} />
        <Label text="Valor"><input value={form.valor} onChange={e => patch('valor', formatCurrencyInput(e.target.value))} className="field text-2xl font-black" placeholder="R$ 0,00" /></Label>
        <Label text="Descrição"><input value={form.descricao} onChange={e => patch('descricao', e.target.value)} className="field" placeholder="Ex: aluguel, salário, assinatura..." /></Label>
        {form.tipo !== 'TRANSFERENCIA' && <div className="mt-4"><span className="text-sm font-semibold text-slate-600">Categoria</span><button type="button" onClick={() => setPicker(true)} className="mt-2 flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-left"><span className={form.categoria ? 'font-bold text-slate-800' : 'text-slate-400'}>{form.categoria ? `${form.categoria}${form.subcategoria ? ` > ${form.subcategoria}` : ''}` : 'Selecionar categoria'}</span><Icon name="ChevronLeft" className="rotate-180 text-slate-300" /></button></div>}
        {form.tipo === 'GASTO' && <>
          <Label text="Forma de pagamento"><select value={form.formaPagamento} onChange={e => patch('formaPagamento', e.target.value)} className="field"><option>Crédito</option><option>Débito</option><option>Pix</option><option>Dinheiro</option></select></Label>
          {form.formaPagamento === 'Crédito' && <Label text="Cartão"><select value={form.cartao} onChange={e => patch('cartao', e.target.value)} className="field">{cards.filter(c => c.ativo !== false).map(c => <option key={c.nome}>{c.nome}</option>)}</select></Label>}
        </>}
        {form.tipo === 'GANHO' && <Label text="Conta"><input value={form.conta} onChange={e => patch('conta', e.target.value)} className="field" /></Label>}
        {form.tipo === 'TRANSFERENCIA' && <><Label text="Conta origem"><input value={form.contaOrigem} onChange={e => patch('contaOrigem', e.target.value)} className="field" /></Label><Label text="Conta destino"><input value={form.contaDestino} onChange={e => patch('contaDestino', e.target.value)} className="field" /></Label></>}
        <Label text="Frequência"><select value={form.frequencia} onChange={e => patch('frequencia', e.target.value)} className="field">{frequencias.map(x => <option key={x}>{x}</option>)}</select></Label>
        <Label text="Próxima data"><input type="date" value={form.data} onChange={e => patch('data', e.target.value)} className="field" /></Label>
        <Label text="Fim opcional"><input type="date" value={form.fimRecorrencia} onChange={e => patch('fimRecorrencia', e.target.value)} className="field" /></Label>
        <Label text="Membro"><select value={form.membro} onChange={e => patch('membro', e.target.value)} className="field"><option value="">Sem membro</option>{members.filter(m => m.ativo !== false).map(m => <option key={m.nome} value={m.nome}>{m.apelido || m.nome}</option>)}</select></Label>
        <Label text="Tags"><input value={form.tags} onChange={e => patch('tags', e.target.value)} className="field" /></Label>
        <Label text="Observações"><textarea value={form.observacoes} onChange={e => patch('observacoes', e.target.value)} className="field min-h-24" /></Label>
      </>}

      <button disabled={loading} className="btn-primary mt-6 w-full">{loading ? 'Salvando...' : 'Salvar'}</button>
    </form>
    {picker && <CategoryPicker type={form.tipo} categories={categories} onClose={() => setPicker(false)} onSelect={x => { setForm(prev => ({ ...prev, ...x })); setPicker(false); }} />}
  </Modal>;
}

function defaultAdminForm(kind, cards = [], tipo = 'GASTO') {
  if (kind === 'categorias') return { tipo: 'GASTO', categoria: '', subcategoria: '', cor: '#16a34a', icone: 'CircleDollarSign' };
  if (kind === 'cartoes') return { nome: '', bandeira: '', banco: '', cor: '#111827', fechamento: 10, vencimento: 17, limite: '' };
  if (kind === 'membros') return { nome: '', apelido: '', cor: '#2FA4DC' };
  return { ...initialLaunch, tipo, cartao: cards[0]?.nome || '', recorrente: true, frequencia: 'Mensal' };
}

function App() {
  const [session, setSession] = useState(() => storage.get('session'));
  const [page, setPage] = useState('home');
  const [categories, setCategories] = useState([]);
  const [cards, setCards] = useState([]);
  const [members, setMembers] = useState([]);
  const [recorrentes, setRecorrentes] = useState([]);
  const [launchOpen, setLaunchOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  function show(message, type = 'success') { setToast({ message, type }); setTimeout(() => setToast(null), 3500); }

  async function loadData() {
    if (!session) return;
    setLoadingData(true);
    try {
      const [cat, car, mem, rec] = await Promise.all([api.getCategorias(), api.getCartoes(), api.getMembros(), api.getRecorrentes()]);
      setCategories((cat.categorias || []).filter(x => x.ativo !== false));
      setCards((car.cartoes || []).filter(x => x.ativo !== false));
      setMembers((mem.membros || []).filter(x => x.ativo !== false));
      setRecorrentes((rec.recorrentes || []).filter(x => x.ativo !== false));
    } catch (err) {
      show(err.message || 'Erro ao carregar dados.', 'error');
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => { loadData(); }, [session]);

  if (!session) return <><Login onLogin={setSession} /><Toast toast={toast} onClose={() => setToast(null)} /></>;

  function logout() {
    storage.remove('session');
    setSession(null);
    setPage('home');
  }

  const adminProps = { categories, cards, members, setCategories, setCards, setMembers, setRecorrentes, onBack: () => setPage('settings'), onNotify: show };
  let content = null;
  if (page === 'home') content = <Home session={session} onLaunch={() => setLaunchOpen(true)} setPage={setPage} />;
  if (page === 'settings') content = <Settings setPage={setPage} onLogout={logout} />;
  if (page === 'admin:categorias') content = <AdminPage kind="categorias" data={categories} {...adminProps} />;
  if (page === 'admin:cartoes') content = <AdminPage kind="cartoes" data={cards} {...adminProps} />;
  if (page === 'admin:membros') content = <AdminPage kind="membros" data={members} {...adminProps} />;
  if (page === 'admin:recorrentes') content = <AdminPage kind="recorrentes" data={recorrentes} {...adminProps} />;

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {loadingData && <div className="fixed left-0 right-0 top-0 z-[70] h-1 bg-green-500" />}
      {content}
      <BottomNav page={page} setPage={setPage} onPlus={() => setLaunchOpen(true)} />
      {launchOpen && <LaunchModal onClose={() => setLaunchOpen(false)} categories={categories} cards={cards} members={members} onNotify={show} />}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default App;
