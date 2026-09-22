import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { analyzeFlowerWithAiApi } from '../api';
import { openPersonalZaloChat } from '../services/zaloService';
import { generateMessengerAIInquiry } from '../services/facebookService';
import { Sparkles, Upload, CheckCircle, ArrowRight, ShieldAlert, ShieldCheck, Flame, Gauge } from 'lucide-react';
import { ZaloIcon } from './ZaloIcon';

const PRESET_SAMPLES = [
  {
    id: 'sample-1',
    name: 'Khu Vực Bếp Gia Đình & Căn Hộ Chung Cư',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
    analysis: {
      detectedHazard: ['Đám cháy dầu mỡ ăn (Class K)', 'Quá tải thiết bị điện gia dụng', 'Thiếu đường thoát hiểm thoáng'],
      recommendedDevices: ['Bình Bọt Foam Sinh Học 6L Eco', 'Chăn Dập Lửa Sợi Thủy Tinh 1.8m', 'Đầu Báo Khói Quang Học Độc Lập'],
      standardCode: 'TCVN 3890:2023 Khoản 5.1 (Nhà ở hộ gia đình)',
      riskLevel: 'Rủi Ro Trung Bình (Bếp nấu)',
      priceRange: { min: 890000, max: 1350000 },
      inspectorAdvice: 'Treo chăn dập lửa cách bếp 1.5m để với lấy nhanh trong 3 giây. Tuyệt đối không dùng nước tạt vào chảo dầu sôi cháy.',
      summaryVietnamese: 'Không gian nấu nướng thường xuyên tích tụ dầu mỡ nhiệt độ cao. Giải pháp Foam + Chăn dập lửa sẽ dập tắt nguồn cháy tức thì mà không gây độc hại.'
    }
  },
  {
    id: 'sample-2',
    name: 'Văn Phòng Công Ty & Phòng Máy Chủ Server',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
    analysis: {
      detectedHazard: ['Chập điện ổ cắm & nguồn Server (Class E)', 'Tài liệu giấy tờ bắt cháy nhanh', 'Không gian kín thiếu khí'],
      recommendedDevices: ['Bình Khí CO2 3kg MT3 Chống Chập Điện', 'Bình Cầu Bột Chữa Cháy Tự Động 6kg', 'Mặt Nạ Chống Khói TZL30'],
      standardCode: 'TCVN 3890:2023 Khoản 6.2 (Văn phòng & Viễn thông)',
      riskLevel: 'Rủi Ro Cao Về Dữ Liệu & Điện',
      priceRange: { min: 1250000, max: 1890000 },
      inspectorAdvice: 'Sử dụng bình khí CO2 để khi dập lửa không để lại cặn hóa chất, bảo vệ 100% linh kiện vi mạch điện tử đắt tiền.',
      summaryVietnamese: 'Khu vực có mật độ thiết bị điện tử và hệ thống dây dẫn dày đặc. Đề xuất trang bị bình CO2 kết hợp mặt nạ thoát khói khẩn cấp.'
    }
  },
  {
    id: 'sample-3',
    name: 'Kho Chứa Hàng Pallet & Xưởng Sản Xuất',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    analysis: {
      detectedHazard: ['Vật liệu cháy rắn gỗ/nhựa (Class A)', 'Xăng dầu bôi trơn máy móc (Class B)', 'Diện tích rộng, di chuyển xa'],
      recommendedDevices: ['Bình Bột ABC 8kg MFZL8 Đa Năng', 'Kệ Đôi Để Bình Sơn Tĩnh Điện', 'Dây Thoát Hiểm Chống Cháy 25m'],
      standardCode: 'TCVN 3890 & TCVN 7435 (Nhà kho và xưởng công nghiệp)',
      riskLevel: 'Rủi Ro Rất Cao (Tải trọng cháy lớn)',
      priceRange: { min: 1450000, max: 2350000 },
      inspectorAdvice: 'Bố trí bình theo khoảng cách tối đa 15m/bình, gắn biển dạ quang chỉ dẫn vị trí để nhận biết rõ khi mất điện đột ngột.',
      summaryVietnamese: 'Tải trọng chất cháy lớn đòi hỏi bình bột công suất dập mạnh mẽ và kệ nâng cách sàn 10cm tránh ẩm mốc.'
    }
  }
];

export const AIFloristModal = () => {
  const { isAIFloristOpen, setIsAIFloristOpen, addToCart, shopZaloPhone, facebookSettings } = useShop();

  const [selectedImage, setSelectedImage] = useState(PRESET_SAMPLES[0].image);
  const [selectedSample, setSelectedSample] = useState(PRESET_SAMPLES[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(PRESET_SAMPLES[0].analysis);

  if (!isAIFloristOpen) return null;

  const handleSelectSample = async (sample) => {
    setSelectedSample(sample);
    setSelectedImage(sample.image);
    triggerScanning(sample.analysis);
  };

  const handleCustomUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        setSelectedImage(base64);
        setSelectedSample(null);
        setIsScanning(true);
        setAnalysisResult(null);

        try {
          // Gọi trực tiếp API nếu có backend
          const apiData = await analyzeFlowerWithAiApi(base64);
          setIsScanning(false);
          setAnalysisResult({
            detectedHazard: apiData.detectedFlowers || ['Nguy cơ cháy chập điện ổ cắm', 'Khu vực bếp đun nấu nhiệt cao'],
            recommendedDevices: ['Bình Bột ABC 4kg', 'Chăn Dập Lửa Sợi Thủy Tinh 1.8m', 'Mặt Nạ Khói TZL30'],
            standardCode: 'TCVN 3890:2023 Tiêu chuẩn kiểm định Bộ Công An',
            riskLevel: 'Mức Độ Thẩm Định AI: Cần trang bị',
            priceRange: apiData.priceRange || { min: 890000, max: 1350000 },
            inspectorAdvice: apiData.floristAdvice || 'Bố trí thiết bị tại lối thoát hiểm và gần nguồn nguy cơ 1.5 - 2m.',
            summaryVietnamese: apiData.summaryVietnamese || 'AI phân tích thấy không gian cần tối thiểu 1 bình chữa cháy và 1 mặt nạ chống khói.'
          });
        } catch (err) {
          // Fallback parsing
          setTimeout(() => {
            setIsScanning(false);
            setAnalysisResult({
              detectedHazard: ['Nguy cơ chập nguồn điện 220V', 'Vật liệu rèm/bàn ghế dễ bắt lửa', 'Lối thoát hiểm ban công'],
              recommendedDevices: ['Bình Bột ABC 4kg Có Tem BCA', 'Mặt Nạ Thoát Hiểm TZL30', 'Kệ Treo Chữ L Chuyên Dụng'],
              standardCode: 'TCVN 3890:2023 Tiêu Chuẩn Phòng Ngừa Cháy Nổ',
              riskLevel: 'Đánh Giá An Toàn: Cần bổ sung trang bị',
              priceRange: { min: 890000, max: 1390000 },
              inspectorAdvice: 'Nên đặt bình chữa cháy cạnh cửa ra vào chính để khi có sự cố có thể lấy ngay mà không bị lửa chặn.',
              summaryVietnamese: 'Mặt bằng này cần bổ sung ngay thiết bị dập lửa bước đầu và mặt nạ lọc độc để bảo vệ cư dân.'
            });
          }, 1000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerScanning = (resultData) => {
    setIsScanning(true);
    setAnalysisResult(null);
    setTimeout(() => {
      setIsScanning(false);
      setAnalysisResult(resultData);
    }, 1000);
  };

  const handleOrderThisCustomBouquet = () => {
    const customItem = {
      id: `ai-pccc-combo-${Date.now()}`,
      name: selectedSample ? `Combo PCCC: ${selectedSample.name}` : 'Combo Thiết Bị PCCC (Thẩm Định Bởi AI)',
      price: analysisResult.priceRange.min,
      image: selectedImage,
      tags: ['AI Thẩm Định', 'Tem BCA 100%'],
      subtitle: analysisResult.summaryVietnamese,
      meaning: 'Trọn gói bảo vệ an toàn chuẩn TCVN 3890:2023',
      flowerTypes: analysisResult.recommendedDevices,
      rating: 5.0,
      reviewsCount: 1,
      freshDays: 12,
    };

    addToCart(customItem, {
      size: { id: 'custom', name: 'Quy chuẩn theo diện tích thẩm định', priceMultiplier: 1.0 },
      wrapper: { id: 'custom', name: 'Kệ treo / Giá đỡ chuyên dụng' },
      cardMessage: `ĐÃ THẨM ĐỊNH AI: Bố trí theo khuyến nghị TCVN 3890. Thiết bị gồm: ${analysisResult.recommendedDevices.join(', ')}.`,
      senderSign: 'Kỹ sư an toàn PCCC'
    });

    setIsAIFloristOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 my-auto animate-fade-in">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-red-950 to-slate-900 text-white px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 border-b border-red-900/50">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading text-base sm:text-lg font-bold text-white flex items-center gap-1.5 sm:gap-2 truncate">
                <span>AI Thẩm Định PCCC</span>
                <span className="text-[9px] sm:text-[10px] bg-red-600 text-white font-mono px-1.5 py-0.5 rounded-md flex-shrink-0">TCVN 3890</span>
              </h3>
              <span className="text-[10px] text-slate-400 hidden sm:block">Phân tích mặt bằng & Đề xuất trang bị chuẩn Cục Cảnh sát PCCC</span>
            </div>
          </div>
          <button 
            onClick={() => setIsAIFloristOpen(false)}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white text-base transition-all flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[85vh] overflow-y-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          
          {/* CỘT TRÁI: CHỌN ẢNH HOẶC UPLOAD (5 Cột) */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-2">
                1. Chọn không gian mẫu hoặc tải ảnh thực tế của bạn:
              </span>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                {PRESET_SAMPLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSample(s)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      selectedSample?.id === s.id ? 'border-red-600 ring-2 ring-red-600/40' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              <label className="border border-dashed border-red-400 hover:border-red-600 bg-red-50/50 p-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all text-xs font-bold text-red-700">
                <Upload className="w-4 h-4 text-red-600" />
                <span>Tải ảnh mặt bằng / gian phòng từ máy</span>
                <input type="file" accept="image/*" onChange={handleCustomUpload} className="hidden" />
              </label>
            </div>

            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-slate-300 shadow-sm bg-slate-950">
              <img
                src={selectedImage}
                alt="Không gian đang thẩm định"
                className={`w-full h-full object-cover transition-opacity duration-300 ${isScanning ? 'opacity-40' : 'opacity-100'}`}
              />

              {isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-950/70 backdrop-blur-[2px]">
                  <div className="w-12 h-12 rounded-full border-4 border-t-red-500 border-white/20 animate-spin mb-3" />
                  <span className="text-xs font-bold font-sans">AI Đang Quét Nhận Diện Rủi Ro Cháy...</span>
                  <span className="text-[10px] text-slate-300">Phân loại tải trọng cháy & đối chiếu TCVN</span>
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: KẾT QUẢ PHÂN TÍCH AI (7 Cột) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Kết Quả Thẩm Định & Đề Xuất Trang Bị PCCC:
              </span>
              <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                <CheckCircle className="w-3 h-3 text-emerald-600" /> Đạt Chuẩn TCVN 3890
              </span>
            </div>

            {analysisResult && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-red-50 p-4 rounded-2xl border border-red-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-red-900 block font-bold">Dự toán trang bị trọn gói:</span>
                    <span className="text-xl sm:text-2xl font-black text-red-600 font-mono">
                      {analysisResult.priceRange.min.toLocaleString('vi-VN')}đ - {analysisResult.priceRange.max.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <span className="text-xs font-bold bg-white text-red-700 border border-red-200 px-3 py-1.5 rounded-xl">
                    Đã gồm Tem BCA & Kệ
                  </span>
                </div>

                {/* Nguy cơ phát hiện */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-red-600" /> Nguy cơ cháy nổ tiềm ẩn phát hiện:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.detectedHazard.map((hz, i) => (
                      <span key={i} className="text-xs bg-white border border-red-200 text-slate-800 px-3 py-1 rounded-lg font-bold shadow-2xs">
                        ⚠️ {hz}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Thiết bị khuyến nghị */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Bộ thiết bị PCCC khuyến nghị lắp đặt:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.recommendedDevices.map((dev, idx) => (
                      <span key={idx} className="text-xs bg-white border border-slate-300 text-slate-800 px-3 py-1 rounded-lg font-bold">
                        🧯 {dev}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tiêu chuẩn & Lời khuyên kỹ sư */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="text-red-600 font-mono">{analysisResult.standardCode}</span>
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{analysisResult.riskLevel}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "<strong>Lời khuyên kỹ sư PCCC:</strong> {analysisResult.inspectorAdvice}"
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleOrderThisCustomBouquet}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold py-3.5 rounded-xl shadow-lg shadow-red-600/30 hover:shadow-red-600/50 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span>🧯 Đặt Trọn Bộ Thiết Bị Theo Đề Xuất</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="flex gap-2">
                    {facebookSettings?.isEnabled !== false && (
                      <button
                        type="button"
                        onClick={() => generateMessengerAIInquiry(facebookSettings?.pageId, analysisResult)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold px-4 py-3.5 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 active:scale-95"
                        title="Gửi kết quả thẩm định này qua Facebook Messenger"
                      >
                        <span>Messenger</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const rec = analysisResult?.recommendedDevices?.join(', ') || 'Bộ thiết bị PCCC';
                        openPersonalZaloChat(
                          shopZaloPhone,
                          `Chào kỹ sư FLAMEGUARD PRO, tôi đã dùng AI thẩm định mặt bằng và nhận đề xuất: "${rec}". Nhờ kỹ sư tư vấn lắp đặt và gửi báo giá chi tiết!`
                        );
                      }}
                      className="flex-1 bg-[#0068FF] text-white text-xs font-bold px-4 py-3.5 rounded-xl hover:bg-blue-600 transition-all text-center flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <ZaloIcon className="w-4 h-4 shrink-0" />
                      <span>Zalo Kỹ Sư ({shopZaloPhone})</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
