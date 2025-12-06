import React, { useState, useEffect, useRef } from 'react';
import { CommandNode } from '../types';
import { X, User, Plus, Trash2, Users, Shield, GitFork, Target, Save, Layout, Camera, Upload } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// TEMPLATES TÁTICOS PADRÃO
const TEMPLATES: Record<string, CommandNode> = {
    DEFAULT: {
        id: 'root',
        role: 'Comandante da Operação',
        name: 'Cel. Referência',
        color: '#3b82f6',
        subordinates: [
            { id: 'sub1', role: 'Líder Alpha', name: 'Sgt. Ponta', color: '#10b981', subordinates: [] },
            { id: 'sub2', role: 'Líder Bravo', name: 'Sgt. Retaguarda', color: '#10b981', subordinates: [] }
        ]
    },
    SWAT: {
        id: 'swat-root',
        role: 'Líder Tático (TL)',
        name: 'Elemento 01',
        color: '#1f2937',
        subordinates: [
            { 
                id: 'scout', role: 'Scout/Pointman', name: 'Operador 02', color: '#ef4444', 
                subordinates: [] 
            },
            { 
                id: 'breacher', role: 'Breacher', name: 'Operador 03', color: '#f59e0b', 
                subordinates: [
                     { id: 'shield', role: 'Escudeiro', name: 'Operador 04', color: '#3b82f6', subordinates: [] }
                ] 
            },
            { 
                id: 'sniper', role: 'Sniper Overwatch', name: 'Sierra 01', color: '#10b981', 
                subordinates: [] 
            }
        ]
    },
    RIOT: {
        id: 'riot-root',
        role: 'Comandante de Choque',
        name: 'Oficial Cmt',
        color: '#1e40af',
        subordinates: [
            { 
                id: 'gas', role: 'Lançadores (Químico)', name: 'Eq. Gás', color: '#f97316', 
                subordinates: [] 
            },
            { 
                id: 'shield-wall', role: 'Parede de Escudos', name: 'Pelotão Alpha', color: '#374151', 
                subordinates: [
                    { id: 's1', role: 'Interventor', name: 'Captura', color: '#ef4444', subordinates: [] }
                ] 
            },
             { 
                id: 'log', role: 'Logística/Reserva', name: 'Apoio', color: '#6b7280', 
                subordinates: [] 
            }
        ]
    },
    TARGET_ANALYSIS: {
        id: 'target-root',
        role: 'ALVO PRINCIPAL (01)',
        name: 'Marcola / Nem',
        color: '#ef4444', // Vermelho Hostil
        subordinates: [
            { 
                id: 'finance', role: 'Financeiro / Lavagem', name: 'Doleiro X', color: '#f59e0b', 
                subordinates: [
                    { id: 'front1', role: 'Laranja', name: 'Empresa Fantasma LTDA', color: '#9ca3af', subordinates: [] }
                ] 
            },
            { 
                id: 'routine', role: 'Rotina / Locais', name: 'Padrão de Vida', color: '#8b5cf6', 
                subordinates: [
                    { id: 'home', role: 'Pernoite', name: 'Condomínio Luxo', color: '#6b7280', subordinates: [] },
                    { id: 'gym', role: 'Frequência', name: 'Academia Barra', color: '#6b7280', subordinates: [] }
                ] 
            },
             { 
                id: 'associates', role: 'Braço Direito', name: 'Gerente do Tráfico', color: '#dc2626', 
                subordinates: [] 
            }
        ]
    }
};

// COMPONENTE RECURSIVO (Extraído para fora para evitar re-renderização excessiva)
interface OrgNodeProps {
    node: CommandNode;
    onAdd: (parentId: string) => void;
    onRemove: (id: string) => void;
    onUpdate: (id: string, updates: Partial<CommandNode>) => void;
    level: number;
}

const OrgNode: React.FC<OrgNodeProps> = ({ node, onAdd, onRemove, onUpdate, level }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onUpdate(node.id, { imageUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex flex-col items-center">
            <div className="relative group">
                <div 
                    className="w-64 p-0 rounded-lg shadow-xl bg-gray-800 hover:bg-gray-750 transition-all flex border border-gray-600 overflow-hidden relative z-10"
                >
                    {/* Left Side: Avatar / Photo */}
                    <div 
                        className="w-20 bg-gray-900 flex items-center justify-center cursor-pointer relative group/image shrink-0 border-r border-gray-700"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ borderLeft: `4px solid ${node.color}` }}
                    >
                        {node.imageUrl ? (
                            <img src={node.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User size={24} className="text-gray-600" />
                        )}
                        
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity">
                            <Camera size={16} className="text-white"/>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                    </div>

                    {/* Right Side: Info */}
                    <div className="flex-1 flex flex-col p-2 min-w-0">
                         <div className="flex justify-between items-start border-b border-gray-700/50 pb-1 mb-1">
                             {/* Editable Role/Function Input */}
                             <input 
                                type="text"
                                value={node.role}
                                onChange={(e) => onUpdate(node.id, { role: e.target.value })}
                                className="bg-transparent text-[10px] font-bold uppercase text-gray-400 w-full outline-none focus:text-blue-400 placeholder-gray-600"
                                placeholder="FUNÇÃO/CARGO"
                             />
                             
                             {/* Actions */}
                             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                                 <button onClick={() => onAdd(node.id)} className="text-green-400 hover:text-green-300" title="Adicionar Subordinado"><Plus size={12}/></button>
                                 <button onClick={() => onRemove(node.id)} className="text-red-400 hover:text-red-300" title="Remover"><Trash2 size={12}/></button>
                             </div>
                        </div>
                        
                        <div className="flex items-center gap-1 mt-1">
                            {/* Editable Name Input */}
                            <input 
                                type="text"
                                value={node.name}
                                onChange={(e) => onUpdate(node.id, { name: e.target.value })}
                                className="bg-transparent text-sm font-bold text-white w-full outline-none focus:text-blue-200 placeholder-gray-600 truncate"
                                placeholder="NOME DO ATIVO"
                            />
                        </div>
                    </div>
                </div>
                
                {/* Vertical Line Connector */}
                {node.subordinates && node.subordinates.length > 0 && (
                    <div className="absolute left-1/2 bottom-0 w-px h-6 bg-gray-600 transform translate-y-full"></div>
                )}
            </div>

            {/* Children Container */}
            {node.subordinates && node.subordinates.length > 0 && (
                <div className="flex gap-4 mt-6 pt-2 border-t border-gray-600 relative">
                     {node.subordinates.map(sub => (
                         <div key={sub.id} className="relative">
                             {/* Vertical line up to the horizontal bar */}
                             <div className="absolute left-1/2 top-0 w-px h-2 bg-gray-600 -translate-y-full"></div>
                             <OrgNode 
                                node={sub} 
                                level={level + 1} 
                                onAdd={onAdd}
                                onRemove={onRemove}
                                onUpdate={onUpdate}
                             />
                         </div>
                     ))}
                </div>
            )}
        </div>
    );
};

export const OrganogramModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const [hierarchy, setHierarchy] = useState<CommandNode>(TEMPLATES.DEFAULT);
    const [customTemplates, setCustomTemplates] = useState<Record<string, CommandNode>>({});

    // Carregar modelos personalizados do LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem('geotime_org_templates');
        if (saved) {
            try {
                setCustomTemplates(JSON.parse(saved));
            } catch (e) {
                console.error("Erro ao carregar templates salvos");
            }
        }
    }, []);

    if (!isOpen) return null;

    // Recursive function to add a node
    const addSubordinate = (parentId: string, current: CommandNode): CommandNode => {
        if (current.id === parentId) {
            return {
                ...current,
                subordinates: [
                    ...(current.subordinates || []),
                    { id: uuidv4(), role: 'Nova Função', name: 'Novo Nome', color: '#6b7280', subordinates: [] }
                ]
            };
        }
        if (current.subordinates) {
            return {
                ...current,
                subordinates: current.subordinates.map(sub => addSubordinate(parentId, sub))
            };
        }
        return current;
    };

    // Recursive function to remove a node
    const removeNode = (nodeId: string, current: CommandNode): CommandNode | null => {
        if (current.id === nodeId) return null; // Remove self (handled by parent map)
        
        if (current.subordinates) {
            return {
                ...current,
                subordinates: current.subordinates
                    .map(sub => removeNode(nodeId, sub))
                    .filter((n): n is CommandNode => n !== null)
            };
        }
        return current;
    };

    // Recursive function to update node
    const updateNode = (nodeId: string, updates: Partial<CommandNode>, current: CommandNode): CommandNode => {
        if (current.id === nodeId) {
            return { ...current, ...updates };
        }
        if (current.subordinates) {
            return {
                ...current,
                subordinates: current.subordinates.map(sub => updateNode(nodeId, updates, sub))
            };
        }
        return current;
    };

    const handleAdd = (parentId: string) => {
        setHierarchy(prev => addSubordinate(parentId, prev));
    };

    const handleRemove = (id: string) => {
        // Prevent removing root
        if (id === hierarchy.id) {
            alert("Não é possível remover o Nó Central.");
            return;
        }
        const newHierarchy = removeNode(id, hierarchy);
        if (newHierarchy) setHierarchy(newHierarchy);
    };

    const handleUpdate = (id: string, updates: Partial<CommandNode>) => {
        setHierarchy(prev => updateNode(id, updates, prev));
    };

    const loadTemplate = (key: string, isCustom = false) => {
        if (isCustom) {
            setHierarchy(JSON.parse(JSON.stringify(customTemplates[key])));
        } else {
            setHierarchy(JSON.parse(JSON.stringify(TEMPLATES[key])));
        }
    };

    const saveCustomTemplate = () => {
        const name = prompt("Dê um nome para este modelo operacional (Ex: Esquadrão Delta):");
        if (!name || name.trim() === "") return;
        
        const newTemplates = { ...customTemplates, [name]: hierarchy };
        setCustomTemplates(newTemplates);
        localStorage.setItem('geotime_org_templates', JSON.stringify(newTemplates));
    };

    const deleteCustomTemplate = (key: string) => {
        if (confirm(`Excluir o modelo "${key}"?`)) {
            const newTemplates = { ...customTemplates };
            delete newTemplates[key];
            setCustomTemplates(newTemplates);
            localStorage.setItem('geotime_org_templates', JSON.stringify(newTemplates));
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-gray-900 w-[90vw] h-[90vh] rounded-lg border border-gray-700 flex flex-col shadow-2xl">
                {/* Header */}
                <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <GitFork className="text-blue-500" />
                        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Cadeia de Comando <span className="text-xs text-gray-500 align-top">Editor de Vínculos</span></h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={saveCustomTemplate}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded transition-colors"
                        >
                            <Save size={14}/> SALVAR MODELO
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="h-12 bg-gray-900 border-b border-gray-800 flex items-center gap-2 px-4 overflow-x-auto custom-scrollbar">
                    <span className="text-xs text-gray-500 uppercase font-bold mr-2 whitespace-nowrap">Padrões:</span>
                    <button onClick={() => loadTemplate('DEFAULT')} className="flex items-center gap-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs border border-gray-600 whitespace-nowrap">
                        <User size={12}/> Padrão
                    </button>
                    <button onClick={() => loadTemplate('SWAT')} className="flex items-center gap-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs border border-gray-600 whitespace-nowrap">
                        <Shield size={12}/> Tático (SWAT)
                    </button>
                    <button onClick={() => loadTemplate('RIOT')} className="flex items-center gap-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs border border-gray-600 whitespace-nowrap">
                        <Users size={12}/> Choque (Riot)
                    </button>
                    
                    <button onClick={() => loadTemplate('TARGET_ANALYSIS')} className="flex items-center gap-1 px-3 py-1 bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded text-xs border border-red-800 whitespace-nowrap">
                        <Target size={12}/> ANÁLISE DE ALVO
                    </button>

                    {Object.keys(customTemplates).length > 0 && (
                        <>
                            <div className="h-6 w-px bg-gray-700 mx-2 shrink-0"></div>
                            <span className="text-xs text-gray-500 uppercase font-bold mr-2 whitespace-nowrap">Meus Modelos:</span>
                            {Object.keys(customTemplates).map(key => (
                                <div key={key} className="flex items-center gap-0.5">
                                    <button 
                                        onClick={() => loadTemplate(key, true)} 
                                        className="flex items-center gap-1 pl-3 pr-2 py-1 bg-blue-900/20 hover:bg-blue-900/40 text-blue-300 rounded-l text-xs border border-blue-800/50 whitespace-nowrap border-r-0"
                                    >
                                        <Layout size={12}/> {key}
                                    </button>
                                    <button
                                        onClick={() => deleteCustomTemplate(key)}
                                        className="p-1 bg-blue-900/20 hover:bg-red-900/50 text-blue-300 hover:text-red-300 rounded-r text-xs border border-blue-800/50 border-l-0"
                                        title="Excluir Modelo"
                                    >
                                        <X size={12}/>
                                    </button>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* Canvas Area */}
                <div className="flex-1 overflow-auto bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-gray-900 p-10 flex justify-center items-start">
                     <OrgNode 
                        node={hierarchy} 
                        level={0} 
                        onAdd={handleAdd}
                        onRemove={handleRemove}
                        onUpdate={handleUpdate}
                     />
                </div>
                
                <div className="p-2 bg-gray-800 border-t border-gray-700 text-center text-[10px] text-gray-500">
                    DICA: Clique no ícone de Usuário/Foto para enviar uma imagem. Digite nos textos para editar.
                </div>
            </div>
        </div>
    );
};