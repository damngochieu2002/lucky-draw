import React, { useEffect, useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Dashboard() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState(null);

    // New Campaign Form State
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState('OFFLINE');
    const [prizes, setPrizes] = useState([{ name: '', quantity: 1 }]);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const res = await api.get('/campaigns');
            setCampaigns(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPrize = () => {
        setPrizes([...prizes, { name: '', quantity: 1 }]);
    };

    const handleRemovePrize = (index) => {
        if (prizes.length > 1) {
            setPrizes(prizes.filter((_, i) => i !== index));
        }
    };

    const handlePrizeChange = (index, field, value) => {
        const newPrizes = [...prizes];
        newPrizes[index][field] = value;
        setPrizes(newPrizes);
    };

    const openEditModal = (campaign) => {
        setEditingCampaign(campaign);
        setNewName(campaign.name);
        setPrizes(campaign.prizes.length > 0 ? campaign.prizes : [{ name: '', quantity: 1 }]);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCampaign(null);
        setNewName('');
        setNewType('OFFLINE');
        setPrizes([{ name: '', quantity: 1 }]);
    };

    const saveCampaign = async (e) => {
        e.preventDefault();
        const validPrizes = prizes.filter(p => p.name.trim() !== '');

        try {
            if (editingCampaign) {
                // Update existing
                await api.put(`/campaigns/${editingCampaign.id}`, {
                    name: newName,
                    prizes: validPrizes
                });
            } else {
                // Create new
                await api.post('/campaigns', {
                    name: newName,
                    type: newType,
                    prizes: validPrizes
                });
            }
            closeModal();
            fetchCampaigns();
        } catch (err) {
            alert('Failed to save campaign');
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <header className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                        Lucky Draw Manager
                    </h1>
                    <p className="text-gray-400 mt-2">Manage your events and spinning wheels</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                >
                    + New Campaign
                </button>
            </header>

            {loading ? (
                <div className="text-center text-gray-500">Loading campaigns...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campaigns.map((c) => (
                        <motion.div
                            key={c.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md hover:bg-white/10 transition-colors"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className={`text-xs font-bold px-2 py-1 rounded ${c.type === 'ONLINE' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                    {c.type}
                                </span>
                                <button
                                    onClick={() => openEditModal(c)}
                                    className="text-xs text-gray-400 hover:text-white transition-colors"
                                >
                                    ✏️ Edit
                                </button>
                            </div>
                            <h3 className="text-xl font-semibold mb-2 text-white">{c.name}</h3>
                            <div className="mb-4">
                                <p className="text-sm text-gray-400">Prizes:</p>
                                <ul className="text-sm text-gray-300 list-disc list-inside">
                                    {c.prizes.slice(0, 3).map((p, i) => (
                                        <li key={i}>{p.quantity}x {p.name}</li>
                                    ))}
                                    {c.prizes.length > 3 && <li>...and {c.prizes.length - 3} more</li>}
                                </ul>
                            </div>
                            <div className="flex gap-3 mt-4">
                                <Link
                                    to={`/campaign/${c.id}/qr`}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-center py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    📱 QR Check-in
                                </Link>
                                <Link
                                    to={`/campaign/${c.id}/screen`}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-center py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-purple-900/40"
                                >
                                    🎰 Launch
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal Overlay */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#1e1e1e] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-white">
                            {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
                        </h2>
                        <form onSubmit={saveCampaign}>
                            <div className="mb-4">
                                <label className="block text-sm text-gray-400 mb-1">Event Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="e.g. Year End Party 2024"
                                />
                            </div>

                            {!editingCampaign && (
                                <div className="mb-4">
                                    <label className="block text-sm text-gray-400 mb-1">Type</label>
                                    <select
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                        value={newType}
                                        onChange={e => setNewType(e.target.value)}
                                    >
                                        <option value="OFFLINE">Offline Event (In-person)</option>
                                        <option value="ONLINE">Online Event (Livestream)</option>
                                    </select>
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="block text-sm text-gray-400 mb-1">Prizes</label>
                                {prizes.map((prize, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2 items-center">
                                        <input
                                            type="text"
                                            placeholder="Prize Name"
                                            className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                            value={prize.name}
                                            onChange={e => handlePrizeChange(idx, 'name', e.target.value)}
                                            required
                                        />
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            className="w-16 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                            value={prize.quantity}
                                            onChange={e => handlePrizeChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                                            min="1"
                                        />
                                        {prizes.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemovePrize(idx)}
                                                className="text-red-400 hover:text-red-300 text-lg"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={handleAddPrize}
                                    className="text-xs text-blue-400 hover:text-blue-300"
                                >
                                    + Add another prize
                                </button>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-white px-4 py-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium"
                                >
                                    {editingCampaign ? 'Save Changes' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
