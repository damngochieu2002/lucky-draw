import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api';

export default function QRCodePage() {
    const { id } = useParams();
    const [campaign, setCampaign] = useState(null);

    const checkInUrl = `${window.location.origin}/campaign/${id}/checkin`;

    useEffect(() => {
        api.get(`/campaigns/${id}`).then(res => setCampaign(res.data)).catch(console.error);
    }, [id]);

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-indigo-900 via-purple-900 to-black">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 text-center max-w-lg w-full shadow-2xl">
                <h1 className="text-3xl font-bold text-white mb-2">
                    {campaign?.name || 'Loading...'}
                </h1>
                <p className="text-purple-300 mb-8">Quét mã QR để tham gia quay thưởng</p>

                <div className="bg-white p-6 rounded-2xl inline-block shadow-xl mb-6">
                    <QRCodeSVG
                        value={checkInUrl}
                        size={250}
                        level="H"
                        includeMargin={true}
                    />
                </div>

                <p className="text-sm text-gray-400 mb-4 break-all">
                    {checkInUrl}
                </p>

                <div className="flex gap-4 justify-center mt-6">
                    <Link
                        to={`/campaign/${id}/screen`}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-500 hover:to-pink-500 transition-all"
                    >
                        🎰 Mở Big Screen
                    </Link>
                    <Link
                        to="/"
                        className="bg-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-all"
                    >
                        ← Quay lại
                    </Link>
                </div>
            </div>
        </div>
    );
}
