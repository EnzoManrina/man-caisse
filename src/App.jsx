import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';

const { PlusCircle, MinusCircle, Wallet, User, Users, X, AlertCircle, Loader2 } = LucideIcons;

// --- CONFIGURATION AIRTABLE ---
const AIRTABLE_API_KEY = "VOTRE_TOKEN_ICI"; 
const BASE_ID = "VOTRE_BASE_ID_ICI"; 
const TABLE_NAME = "Transactions";
const TEAM_TABLE_NAME = "Equipe";

const App = () => {
  const [team, setTeam] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState('sortie');
  const [formData, setFormData] = useState({ amount: '', reason: '', user: '' });
  const [error, setError] = useState('');
  const [newMemberName, setNewMemberName] = useState('');

  const fetchData = async () => {
    if (!AIRTABLE_API_KEY || !BASE_ID) { setLoading(false); return; }
    try {
      setLoading(true);
      const teamRes = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TEAM_TABLE_NAME}`, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      });
      const teamData = await teamRes.json();
      if (teamData.records) setTeam(teamData.records.map(r => ({ id: r.id, name: r.fields.Nom })));

      const transRes = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}?sort[0][field]=Date&sort[0][direction]=desc`, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      });
      const transData = await transRes.json();
      if (transData.records) setTransactions(transData.records.map(r => ({
        id: r.id,
        type: r.fields.Type || 'sortie',
        amount: r.fields.Montant || 0,
        reason: r.fields.Motif || 'Sans motif',
        user: r.fields.Utilisateur || 'Inconnu',
        date: r.fields.Date
      })));
    } catch (err) { setError("Erreur de connexion"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const totalBalance = transactions.reduce((acc, curr) => 
    curr.type === 'entree' ? acc + (curr.amount || 0) : acc - (curr.amount || 0), 0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.reason || !formData.user) return;
    try {
      const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { "Motif": formData.reason, "Montant": parseFloat(formData.amount), "Type": newType, "Utilisateur": formData.user, "Date": new Date().toISOString() } })
      });
      if (res.ok) { await fetchData(); setFormData({ amount: '', reason: '', user: '' }); setShowAddModal(false); }
    } catch (err) { setError("Erreur d'enregistrement"); }
  };

  if (loading && transactions.length === 0) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-24">
      {error && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold"><AlertCircle size={16} /> {error}</div>}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 pt-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-blue-600 p-2 rounded-xl text-white"><Wallet size={20} /></div>
            <h1 className="text-lg font-bold">CaissePartagée</h1>
          </div>
          <div className="flex border-b border-gray-100">
            <button onClick={() => setActiveTab('transactions')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'transactions' ? 'border-blue-600 text-blue-600' : 'text-gray-400'}`}>Transactions</button>
            <button onClick={() => setActiveTab('team')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'team' ? 'border-blue-600 text-blue-600' : 'text-gray-400'}`}>Équipe ({team.length})</button>
          </div>
        </div>
      </header>
      <main className="max-w-md mx-auto p-4">
        {activeTab === 'transactions' ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-7 rounded-[2rem] text-white shadow-xl">
              <p className="opacity-80 text-xs font-bold uppercase mb-1">Solde actuel</p>
              <h2 className="text-4xl font-extrabold">{totalBalance.toFixed(2)} €</h2>
            </div>
            <div className="space-y-3">
              {transactions.map((t) => (
                <div key={t.id} className="bg-white p-4 rounded-2xl border flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${t.type === 'entree' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{t.type === 'entree' ? <PlusCircle size={20} /> : <MinusCircle size={20} />}</div>
                    <div>
                      <p className="font-bold text-sm">{t.reason}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{t.user} • {t.date ? new Date(t.date).toLocaleDateString('fr-FR') : 'Date inconnue'}</p>
                    </div>
                  </div>
                  <div className={`font-black text-sm ${t.type === 'entree' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === 'entree' ? '+' : '-'}{t.amount.toFixed(2)} €</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {team.map((member) => (
              <div key={member.id} className="bg-white p-4 rounded-2xl border flex items-center gap-2 shadow-sm">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-black text-xs uppercase">{member.name[0]}</div>
                <span className="font-bold text-xs truncate">{member.name}</span>
              </div>
            ))}
          </div>
        )}
      </main>
      {activeTab === 'transactions' && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4">
          <button onClick={() => setShowAddModal(true)} className="bg-slate-900 text-white px-10 py-4 rounded-full font-bold shadow-2xl flex items-center gap-3">
            <PlusCircle size={20} /> Nouveau mouvement
          </button>
        </div>
      )}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8"><h2 className="text-xl font-black">Opération</h2><button onClick={() => setShowAddModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex p-1.5 bg-slate-100 rounded-2xl">
                <button type="button" onClick={() => setNewType('sortie')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${newType === 'sortie' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Dépense (-)</button>
                <button type="button" onClick={() => setNewType('entree')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${newType === 'entree' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Dépôt (+)</button>
              </div>
              <input type="number" step="0.01" required placeholder="0.00" className="w-full p-4 bg-slate-50 rounded-2xl text-2xl font-black" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
              <select required className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm" value={formData.user} onChange={(e) => setFormData({...formData, user: e.target.value})}>
                <option value="">Qui êtes-vous ?</option>
                {team.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
              <input type="text" required placeholder="Motif..." className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} />
              <button type="submit" className={`w-full py-5 rounded-2xl font-black text-white ${newType === 'entree' ? 'bg-emerald-600' : 'bg-rose-600'}`}>Confirmer</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
