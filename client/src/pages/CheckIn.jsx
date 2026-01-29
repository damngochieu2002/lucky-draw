import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { motion } from 'framer-motion';

export default function CheckIn() {
    const { id } = useParams();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [status, setStatus] = useState('IDLE'); // IDLE, SUBMITTING, SUCCESS, ERROR
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('SUBMITTING');
        try {
            await api.post('/participants', {
                campaign_id: id,
                name,
                phone
            });
            setStatus('SUCCESS');
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 409) {
                setError('Số điện thoại này đã được sử dụng');
            } else {
                setError('Failed to check in. Please try again.');
            }
            setStatus('ERROR');
        }
    };

    if (status === 'SUCCESS') {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-blue-900 to-black">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl"
                >
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">You're In!</h2>
                    <p className="text-blue-200 mb-6">Good luck, <b>{name}</b>!</p>
                    <p className="text-sm text-gray-400">Watch the big screen to see if you win.</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-tr from-indigo-900 via-purple-900 to-black">
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl"
            >
                <h1 className="text-2xl font-bold text-center text-white mb-2">Join the Lucky Draw</h1>
                <p className="text-center text-gray-400 mb-8 text-sm">Enter your details to participate</p>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1 ml-1">FULL NAME</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:bg-white/10 transition-all"
                                placeholder="Ex. John Doe"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1 ml-1">PHONE NUMBER (Optional)</label>
                            <input
                                type="tel"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:bg-white/10 transition-all"
                                placeholder="Ex. 0912..."
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                            />
                        </div>
                    </div>

                    {status === 'ERROR' && (
                        <div className="mt-4 text-red-400 text-sm text-center">{error}</div>
                    )}

                    <button
                        type="submit"
                        disabled={status === 'SUBMITTING'}
                        className="w-full mt-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-900/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {status === 'SUBMITTING' ? 'Joining...' : 'Join Now'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
