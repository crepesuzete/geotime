import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckSquare, FileText, X, Ambulance, Crosshair, Users, Activity, Save, EyeOff, Map, Radio, Skull, Zap, ChevronDown } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface SecuritySection {
    id: string;
    title: string;
    icon: React.ReactNode;
    checks: { id: string; label: string; checked: boolean; notes: string }[];
}

export const SecurityPlanModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('precursor');
    const [showPresets, setShowPresets] = useState(false);
    
    // ESTADO DO PLANO DE SEGURANÇA
    const [sections, setSections] = useState<SecuritySection[]>([
        {
            id: 'precursor',
            title: '1. Vistoria Precursora',
            icon: <Activity size={16}/>,
            checks: [
                { id: 'p1', label: 'Análise de Pontos Elevados (Telhados/Janelas) num raio de 1000m?', checked: false, notes: '' },
                { id: 'p2', label: 'Vistoria Antibombas (Varredura Técnica) realizada no palco/púlpito?', checked: false, notes: '' },
                { id: 'p3', label: 'Identificação de Pontos de Estrangulamento (Choke Points) na rota de chegada?', checked: false, notes: '' },
                { id: 'p4', label: 'Verificação de bueiros e subsolo no perímetro imediato?', checked: false, notes: '' }
            ]
        },
        {
            id: 'perimeter',
            title: '2. Perímetros',
            icon: <Shield size={16}/>,
            checks: [
                { id: 'sec1', label: 'Perímetro Interno (Acesso Restrito/Crachá) estabelecido?', checked: false, notes: '' },
                { id: 'sec2', label: 'Perímetro Médio (Revista Pessoal/Magnetômetro) ativo?', checked: false, notes: '' },
                { id: 'sec3', label: 'Controle de Multidões (Barreiras Físicas) instalado?', checked: false, notes: '' }
            ]
        },
        {
            id: 'red_team',
            title: '3. RED TEAM (Análise Hostil)',
            icon: <Skull size={16} className="text-red-500"/>,
            checks: [
                { id: 'rt1', label: 'FUGA: Existe algum prédio com visada E acesso rápido a vias expressas (sem bloqueio)?', checked: false, notes: '' },
                { id: 'rt2', label: 'ASSINATURA: Existem janelas ou buracos em prédios que permitem "tiro recuado" (Deep Room)?', checked: false, notes: '' },
                { id: 'rt3', label: 'SOL: Onde o sol estará no horário do evento? (Favorece o atirador?)', checked: false, notes: '' },
                { id: 'rt4', label: 'MATEMÁTICA: O plano de evacuação é mais rápido que o tempo de recarga/ajuste do atirador?', checked: false, notes: '' }
            ]
        },
        {
            id: 'counter_sniper',
            title: '4. Contra-Sniper (CS)',
            icon: <Crosshair size={16}/>,
            checks: [
                { id: 'cs1', label: 'NEGAÇÃO DE TERRENO: Todos os telhados com visada direta foram ocupados por agentes?', checked: false, notes: '' },
                { id: 'cs2', label: 'BLOQUEIO VISUAL: Foram posicionados banners/caminhões para bloquear a visão de prédios não seguros?', checked: false, notes: '' },
                { id: 'cs3', label: 'Equipes de CS possuem ângulo de tiro limpo para as ameaças elevadas?', checked: false, notes: '' },
                { id: 'cs4', label: 'Janelas abertas no perímetro foram fechadas ou estão monitoradas?', checked: false, notes: '' }
            ]
        },
        {
            id: 'long_range',
            title: '5. Ultra-Longo Alcance',
            icon: <Map size={16}/>,
            checks: [
                { id: 'lr1', label: 'Mapeamento de "High Ground" (Edifícios Altos) em raio estendido (2km - 4km)?', checked: false, notes: '' },
                { id: 'lr2', label: 'Tecnologia de Detecção Acústica (Triangulação de Disparo) instalada?', checked: false, notes: '' },
                { id: 'lr3', label: 'Vigilância Aérea (Helicóptero/Drone) monitorando topos de prédios distantes?', checked: false, notes: '' },
                { id: 'lr4', label: 'Análise de "Line of Sight" reversa a partir do Palco realizada?', checked: false, notes: '' }
            ]
        },
        {
            id: 'med_evac',
            title: '6. Médico e Evacuação',
            icon: <Ambulance size={16}/>,
            checks: [
                { id: 'med1', label: 'Hospital de Trauma Nível 1 mapeado (Tempo de rota < 10min)?', checked: false, notes: '' },
                { id: 'med2', label: 'Sala de Trauma (Choque) reservada no destino?', checked: false, notes: '' },
                { id: 'evac1', label: 'Rota de Fuga Primária e Secundária desobstruídas?', checked: false, notes: '' },
                { id: 'evac2', label: 'Viatura Blindada pronta para extração imediata (Motor ligado)?', checked: false, notes: '' }
            ]
        },
        {
            id: 'intel',
            title: '7. Inteligência',
            icon: <Users size={16}/>,
            checks: [
                { id: 'int1', label: 'Monitoramento de Redes Sociais (Hostis confirmados)?', checked: false, notes: '' },
                { id: 'int2', label: 'Drone de vigilância térmica ativo?', checked: false, notes: '' }
            ]
        }
    ]);

    const handleCheck = (sectionId: string, checkId: string) => {
        setSections(prev => prev.map(sec => {
            if (sec.id !== sectionId) return sec;
            return {
                ...sec,
                checks: sec.checks.map(c => c.id === checkId ? { ...c, checked: !c.checked } : c)
            };
        }));
    };

    const handleNoteChange = (sectionId: string, checkId: string, text: string) => {
        setSections(prev => prev.map(sec => {
            if (sec.id !== sectionId) return sec;
            return {
                ...sec,
                checks: sec.checks.map(c => c.id === checkId ? { ...c, notes: text } : c)
            };
        }));
    };

    const calculateProgress = () => {
        const total = sections.reduce((acc, sec) => acc + sec.checks.length, 0);
        const checked = sections.reduce((acc, sec) => acc + sec.checks.filter(c => c.checked).length, 0);
        return Math.round((checked / total) * 100);
    };

    // --- LOGICA DE PRESETS (AUTOMAÇÃO) ---
    const applyPreset = (level: 'MAX' | 'MED' | 'MIN' | 'CLEAR') => {
        setSections(prev => prev.map(sec => ({
            ...sec,
            checks: sec.checks.map(check => {
                let shouldCheck = false;
                let autoNote = check.notes;

                if (level === 'CLEAR') {
                    return { ...check, checked: false, notes: '' };
                }

                if (level === 'MAX') {
                    // Chefe de Estado: Marca TUDO
                    shouldCheck = true;
                    autoNote = autoNote || "Protocolo Nível 1 Aplicado.";
                } else if (level === 'MED') {
                    // Celebridade/VIP Comum: Marca itens essenciais (Perímetro, Médico, Precursor Básico)
                    const criticalSections = ['precursor', 'perimeter', 'med_evac'];
                    if (criticalSections.includes(sec.id)) shouldCheck = true;
                    // Alguns itens específicos de CS
                    if (check.id === 'cs1' || check.id === 'cs4') shouldCheck = true;
                    autoNote = autoNote || "Protocolo Nível 2 Aplicado.";
                } else if (level === 'MIN') {
                    // Baixo Risco: Apenas Evacuação e Perímetro Interno
                    if (check.id === 'sec1' || check.id === 'evac1' || check.id === 'med1') shouldCheck = true;
                    autoNote = autoNote || "Protocolo Básico Aplicado.";
                }

                return { ...check, checked: shouldCheck, notes: autoNote };
            })
        })));
        setShowPresets(false);
    };

    if (!isOpen) return null;

    const activeSection = sections.find(s => s.id === activeTab);

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-gray-900 w-[90vw] md:w-[800px] h-[85vh] rounded-lg border border-gray-700 flex flex-col shadow-2xl">
                
                {/* Header */}
                <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <Shield className="text-yellow-500" />
                            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Gestão de Missão VIP</h2>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Doutrina de Proteção & Matriz de Risco</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {/* BOTÃO DE PRESETS RÁPIDOS */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowPresets(!showPresets)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold uppercase transition-colors"
                            >
                                <Zap size={14} fill="currentColor"/> Automação <ChevronDown size={14}/>
                            </button>
                            
                            {showPresets && (
                                <div className="absolute top-full right-0 mt-2 w-56 bg-gray-800 border border-gray-600 rounded shadow-xl z-50 overflow-hidden">
                                    <div className="p-2 text-[10px] text-gray-500 font-bold uppercase border-b border-gray-700">Carregar Padrão</div>
                                    <button onClick={() => applyPreset('MAX')} className="w-full text-left px-4 py-2 text-xs text-red-300 hover:bg-red-900/30 border-l-2 border-transparent hover:border-red-500">
                                        Nível 1: Chefe de Estado (Total)
                                    </button>
                                    <button onClick={() => applyPreset('MED')} className="w-full text-left px-4 py-2 text-xs text-yellow-300 hover:bg-yellow-900/30 border-l-2 border-transparent hover:border-yellow-500">
                                        Nível 2: Celebridade/Executivo
                                    </button>
                                    <button onClick={() => applyPreset('MIN')} className="w-full text-left px-4 py-2 text-xs text-green-300 hover:bg-green-900/30 border-l-2 border-transparent hover:border-green-500">
                                        Nível 3: Baixo Risco
                                    </button>
                                    <div className="border-t border-gray-700 my-1"></div>
                                    <button onClick={() => applyPreset('CLEAR')} className="w-full text-left px-4 py-2 text-xs text-gray-400 hover:bg-gray-700">
                                        Limpar Tudo
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="text-right pl-4 border-l border-gray-600">
                            <span className="text-xs text-gray-500 block uppercase font-bold">Prontidão</span>
                            <span className={`text-xl font-mono font-bold ${calculateProgress() === 100 ? 'text-green-500' : 'text-yellow-500'}`}>
                                {calculateProgress()}%
                            </span>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col overflow-y-auto">
                        {sections.map(sec => (
                            <button
                                key={sec.id}
                                onClick={() => setActiveTab(sec.id)}
                                className={`p-4 text-left flex items-center gap-3 transition-colors border-l-4 ${activeTab === sec.id ? 'bg-gray-800 border-yellow-500 text-white' : 'border-transparent text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                            >
                                {sec.icon}
                                <span className="text-xs font-bold uppercase">{sec.title.split('. ')[1]}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 bg-gray-800 p-6 overflow-y-auto custom-scrollbar">
                        {activeSection && (
                            <div className="animate-in slide-in-from-right-4 duration-300">
                                <h3 className="text-lg font-bold text-white mb-6 border-b border-gray-700 pb-2 flex items-center gap-2">
                                    {activeSection.icon} {activeSection.title}
                                </h3>

                                <div className="space-y-6">
                                    {activeSection.checks.map(item => (
                                        <div key={item.id} className="bg-gray-900/50 p-4 rounded border border-gray-700 hover:border-gray-600 transition-colors">
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="pt-1">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={item.checked}
                                                        onChange={() => handleCheck(activeSection.id, item.id)}
                                                        className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-yellow-500 cursor-pointer"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label 
                                                        onClick={() => handleCheck(activeSection.id, item.id)}
                                                        className={`text-sm font-medium cursor-pointer select-none ${item.checked ? 'text-green-400' : 'text-gray-200'}`}
                                                    >
                                                        {item.label}
                                                    </label>
                                                    {item.notes && item.checked && (
                                                         <p className="text-[10px] text-gray-500 mt-1 italic">{item.notes}</p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Simplificação Visual: Só mostra o campo de notas se o item estiver marcado ou se já tiver nota */}
                                            {(item.checked || item.notes) && (
                                                <div className="ml-8 animate-in fade-in">
                                                    <textarea 
                                                        value={item.notes}
                                                        onChange={(e) => handleNoteChange(activeSection.id, item.id, e.target.value)}
                                                        className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-xs text-gray-300 focus:border-yellow-500 outline-none h-12 resize-none"
                                                        placeholder="Nota..."
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="h-12 bg-gray-900 border-t border-gray-800 flex items-center justify-between px-6">
                    <span className="text-[10px] text-gray-500">
                        * Módulo Otimizado para Resposta Rápida (Protocolo Simplificado).
                    </span>
                    <button 
                        className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-2"
                        onClick={() => alert("Protocolo salvo e vinculado à operação vigente.")}
                    >
                        <Save size={14}/> Salvar Protocolo
                    </button>
                </div>
            </div>
        </div>
    );
};