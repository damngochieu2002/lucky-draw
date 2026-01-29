import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function BigScreen() {
    const { id } = useParams();
    const socket = useSocket();
    const [campaign, setCampaign] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState(null);
    const [newJoin, setNewJoin] = useState(null);
    const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);

    // Slot machine animation state
    const [slotNames, setSlotNames] = useState(['?', '?', '?']);
    const slotIntervalRef = useRef(null);

    const fetchData = useCallback(async () => {
        try {
            const [campRes, partRes] = await Promise.all([
                api.get(`/campaigns/${id}`),
                api.get(`/participants/${id}`)
            ]);
            setCampaign(campRes.data);
            setParticipants(partRes.data);
        } catch (err) {
            console.error(err);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!socket) return;

        socket.emit('join_campaign', id);

        socket.on('participant_joined', (participant) => {
            setParticipants(prev => [...prev, participant]);
            setNewJoin(participant);
            setTimeout(() => setNewJoin(null), 3000);
        });

        socket.on('winner_selected', (participant) => {
            // Update local state
            setParticipants(prev => prev.map(p =>
                p.id === participant.id ? participant : p
            ));
            setWinner(participant);
            setIsSpinning(false);

            // Fire confetti!
            fireConfetti();
        });

        socket.on('participant_deleted', ({ id }) => {
            setParticipants(prev => prev.filter(p => p.id !== id));
        });

        return () => {
            socket.off('participant_joined');
            socket.off('winner_selected');
            socket.off('participant_deleted');
        };
    }, [socket, id]);

    const fireConfetti = () => {
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.7 },
                colors: ['#ffd700', '#ff6b6b', '#4ecdc4', '#a855f7']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.7 },
                colors: ['#ffd700', '#ff6b6b', '#4ecdc4', '#a855f7']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    };

    // Get only eligible participants (not yet won)
    const eligibleParticipants = participants.filter(p => p.status !== 'WON');

    const startSpinAnimation = (duration = 5000) => {
        if (eligibleParticipants.length === 0) return;

        setIsSpinning(true);
        setWinner(null);

        const startTime = Date.now();
        let speed = 50;

        const animate = () => {
            const elapsed = Date.now() - startTime;

            // Pick random names for slot effect
            const randomNames = [];
            for (let i = 0; i < 3; i++) {
                const randomParticipant = eligibleParticipants[Math.floor(Math.random() * eligibleParticipants.length)];
                randomNames.push(randomParticipant?.name || '?');
            }
            setSlotNames(randomNames);

            // Slow down gradually
            if (elapsed < duration * 0.5) {
                speed = 50;
            } else if (elapsed < duration * 0.75) {
                speed = 100;
            } else if (elapsed < duration * 0.9) {
                speed = 200;
            } else {
                speed = 400;
            }

            if (elapsed < duration) {
                slotIntervalRef.current = setTimeout(animate, speed);
            } else {
                // Pick final winner
                const winnerIndex = Math.floor(Math.random() * eligibleParticipants.length);
                const selected = eligibleParticipants[winnerIndex];

                const currentPrize = campaign?.prizes?.[currentPrizeIndex];
                if (currentPrize && selected) {
                    // Final slot shows winner name
                    setSlotNames([selected.name, selected.name, selected.name]);

                    // API call to mark winner
                    api.post(`/participants/${selected.id}/win`, { prize: currentPrize.name });
                }
            }
        };

        animate();
    };

    const handleSpin = () => {
        if (isSpinning || eligibleParticipants.length === 0) return;
        startSpinAnimation(4000);
    };

    const handleNextPrize = () => {
        if (campaign?.prizes && currentPrizeIndex < campaign.prizes.length - 1) {
            setCurrentPrizeIndex(prev => prev + 1);
            setWinner(null);
            setSlotNames(['?', '?', '?']);
        }
    };

    const currentPrize = campaign?.prizes?.[currentPrizeIndex];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden relative">
            {/* Animated Stars Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(30)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            opacity: [0.2, 1, 0.2],
                            scale: [1, 1.5, 1],
                        }}
                        transition={{
                            duration: 2 + Math.random() * 3,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                    />
                ))}
            </div>

            {/* New Join Notification */}
            <AnimatePresence>
                {newJoin && (
                    <motion.div
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                        className="fixed top-6 right-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3"
                    >
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl animate-bounce">
                            👋
                        </div>
                        <div>
                            <div className="font-bold text-lg">{newJoin.name}</div>
                            <div className="text-sm text-green-100">vừa tham gia!</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="relative z-10 text-center pt-10 pb-6">
                <motion.h1
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-500 to-purple-500 drop-shadow-2xl"
                >
                    {campaign?.name || 'Lucky Draw'}
                </motion.h1>
                <div className="mt-4 flex justify-center gap-8 text-white/80">
                    <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                        <span className="text-2xl">👥</span>
                        <span className="text-xl font-bold">{participants.length}</span>
                        <span className="text-sm">tham gia</span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-full text-green-300">
                        <span className="text-2xl">🎯</span>
                        <span className="text-xl font-bold">{eligibleParticipants.length}</span>
                        <span className="text-sm">chưa trúng</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col lg:flex-row gap-8 p-8 max-w-7xl mx-auto">

                {/* Participant List */}
                <div className="lg:w-1/3 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-6 max-h-[55vh] overflow-y-auto">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span>🎫</span> Danh sách tham gia
                    </h2>
                    <div className="space-y-2">
                        {participants.map((p) => (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`px-4 py-3 rounded-xl flex justify-between items-center transition-all
                  ${p.status === 'WON'
                                        ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30'
                                        : 'bg-white/5 hover:bg-white/10'}`}
                            >
                                <span className={`font-medium ${p.status === 'WON' ? 'text-yellow-300' : 'text-white'}`}>
                                    {p.status === 'WON' && '🏆 '}{p.name}
                                </span>
                                {p.status === 'WON' && (
                                    <span className="text-xs bg-yellow-500/30 text-yellow-300 px-2 py-1 rounded-full">
                                        {p.won_prize}
                                    </span>
                                )}
                            </motion.div>
                        ))}
                        {participants.length === 0 && (
                            <div className="text-center text-gray-500 py-8">
                                Chưa có người tham gia
                            </div>
                        )}
                    </div>
                </div>

                {/* Spin Area */}
                <div className="lg:w-2/3 flex flex-col items-center justify-center">

                    {/* Current Prize */}
                    {currentPrize && (
                        <motion.div
                            key={currentPrizeIndex}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="mb-8 text-center"
                        >
                            <div className="text-sm text-purple-300 mb-2 tracking-widest">ĐANG QUAY CHO GIẢI</div>
                            <div className="text-4xl md:text-6xl font-black text-white drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                                🎁 {currentPrize.name}
                            </div>
                            <div className="text-purple-300 mt-2">
                                Còn {currentPrize.quantity} phần • Giải {currentPrizeIndex + 1} / {campaign?.prizes?.length}
                            </div>
                        </motion.div>
                    )}

                    {/* Slot Machine Display */}
                    <div className="mb-8 bg-black/40 rounded-2xl p-6 border-4 border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                        <div className="flex gap-4 justify-center">
                            {slotNames.map((name, idx) => (
                                <motion.div
                                    key={idx}
                                    animate={isSpinning ? { y: [0, -10, 0] } : {}}
                                    transition={{ duration: 0.1, repeat: isSpinning ? Infinity : 0 }}
                                    className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl p-4 min-w-[120px] text-center border-2 border-gray-700"
                                >
                                    <span className={`text-xl font-bold ${isSpinning ? 'text-yellow-400' : 'text-white'}`}>
                                        {name}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Winner Display */}
                    <AnimatePresence>
                        {winner && (
                            <motion.div
                                initial={{ scale: 0, rotate: -10 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0 }}
                                className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-20"
                            >
                                <div className="text-center">
                                    <motion.div
                                        initial={{ y: -100 }}
                                        animate={{ y: 0 }}
                                        transition={{ type: 'spring', bounce: 0.5 }}
                                    >
                                        <div className="text-8xl mb-4">🎉🏆🎉</div>
                                        <div className="text-3xl text-yellow-300 mb-4 tracking-wider">CHÚC MỪNG!</div>
                                        <motion.div
                                            className="text-6xl md:text-8xl font-black text-white mb-6"
                                            animate={{ scale: [1, 1.05, 1] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                        >
                                            {winner.name}
                                        </motion.div>
                                        <div className="text-3xl text-purple-300">
                                            Đã trúng: <span className="text-yellow-300 font-bold">{winner.won_prize}</span>
                                        </div>
                                    </motion.div>
                                    <button
                                        onClick={() => { setWinner(null); handleNextPrize(); }}
                                        className="mt-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-10 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-2xl"
                                    >
                                        Tiếp tục quay →
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Spin Button */}
                    <motion.button
                        onClick={handleSpin}
                        disabled={isSpinning || eligibleParticipants.length === 0}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-48 h-48 md:w-56 md:h-56 rounded-full text-3xl md:text-4xl font-black shadow-2xl transition-all relative overflow-hidden
              ${isSpinning
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 cursor-not-allowed'
                                : eligibleParticipants.length === 0
                                    ? 'bg-gray-700 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:shadow-[0_0_80px_rgba(251,146,60,0.6)] cursor-pointer'}
            `}
                    >
                        {isSpinning ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                                className="text-6xl"
                            >
                                🎰
                            </motion.div>
                        ) : eligibleParticipants.length === 0 ? (
                            <span className="text-gray-400 text-2xl">Hết người</span>
                        ) : (
                            <span className="text-white drop-shadow-lg">QUAY!</span>
                        )}

                        {/* Glowing ring animation */}
                        {!isSpinning && eligibleParticipants.length > 0 && (
                            <motion.div
                                className="absolute inset-0 rounded-full border-4 border-white/30"
                                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                        )}
                    </motion.button>

                    {eligibleParticipants.length === 0 && participants.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-6 text-yellow-300 text-xl text-center"
                        >
                            🎊 Tất cả mọi người đều đã trúng thưởng! 🎊
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
