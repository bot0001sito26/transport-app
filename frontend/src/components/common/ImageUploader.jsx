import { Camera } from 'lucide-react';

export default function ImageUploader({ label, preview, onChange, icon: Icon }) {
    return (
        <div className="mt-2 flex justify-center px-4 pt-3 pb-4 border-2 border-slate-300 border-dashed rounded-xl hover:border-atlas-navy/40 hover:bg-atlas-navy/5 transition-colors relative overflow-hidden group h-full min-h-22.5">
            {preview ? (
                <div className="absolute inset-0 w-full h-full">
                    <img src={preview} alt="Vista previa" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs font-bold flex items-center gap-2"><Camera className="w-4 h-4" /> CAMBIAR</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-1.5 text-center my-auto">
                    <Icon className="mx-auto h-5 w-5 text-slate-400" />
                    <div className="flex text-[10px] text-slate-500 justify-center font-bold uppercase tracking-wider">
                        <span>Subir {label}</span>
                    </div>
                </div>
            )}
            <input
                type="file"
                accept="image/jpeg, image/png, image/jpg, application/pdf"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={onChange}
            />
        </div>
    );
}