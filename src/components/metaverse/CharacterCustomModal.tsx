import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import CharacterSVG from './CharacterSVG';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import CharacterPet from './CharacterPet';
import {
  SKIN_COLORS, HAIR_COLORS, BODY_COLORS,
  HAIR_STYLES, ACCESSORIES, PETS,
  type HairStyle, type Accessory, type PetType,
} from '../../lib/constants';

interface Props {
  onClose: () => void;
}

type Tab = 'body' | 'skin' | 'hair' | 'hairStyle' | 'accessory' | 'pet';

const TABS: { id: Tab; label: string }[] = [
  { id: 'body',      label: '옷' },
  { id: 'skin',      label: '피부' },
  { id: 'hair',      label: '머리색' },
  { id: 'hairStyle', label: '헤어' },
  { id: 'accessory', label: '악세' },
  { id: 'pet',       label: '펫' },
];

export default function CharacterCustomModal({ onClose }: Props) {
  const { profile, user } = useAuthStore();

  const [bodyColor, setBodyColor] = useState(profile?.avatar_color ?? '#6C5CE7');
  const [skinColor, setSkinColor] = useState(profile?.skin_color ?? '#FFE0BD');
  const [hairColor, setHairColor] = useState(profile?.hair_color ?? '#5a3e28');
  const [hairStyle, setHairStyle] = useState<HairStyle>((profile?.hair_style as HairStyle) ?? 'default');
  const [accessory, setAccessory] = useState<Accessory>((profile?.accessory as Accessory) ?? 'none');
  const [pet, setPet] = useState<PetType>((profile?.pet as PetType) ?? 'none');
  const [activeTab, setActiveTab] = useState<Tab>('body');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user?.id || saving) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        avatar_color: bodyColor,
        skin_color: skinColor,
        hair_color: hairColor,
        hair_style: hairStyle,
        accessory,
        pet,
      })
      .eq('id', user.id);
    if (error) {
      console.error('캐릭터 저장 실패:', error.message);
      setSaving(false);
      return;
    }
    await useAuthStore.getState().fetchProfile(user.id);
    setSaving(false);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative z-10 flex flex-col rounded-2xl border border-white/10 shadow-2xl"
        style={{ background: 'rgba(30,24,40,.97)', width: 380, maxHeight: '90vh' }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <h2 className="text-base font-bold text-text-primary font-heading">캐릭터 꾸미기</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* 미리보기 */}
        <div className="flex flex-col items-center py-5 gap-2">
          <div
            className="relative flex items-center justify-center rounded-2xl"
            style={{ width: 100, height: 100, background: 'rgba(255,255,255,.05)' }}
          >
            <CharacterSVG
              color={bodyColor}
              skinColor={skinColor}
              hairColor={hairColor}
              hairStyle={hairStyle}
              accessory={accessory}
              size={64}
            />
            {pet !== 'none' && <CharacterPet type={pet} ownerDirection="right" />}
          </div>
          <span className="text-xs text-text-secondary">
            {profile?.nickname || profile?.name}
          </span>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 px-4 border-b border-white/10">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-2 text-xs font-medium transition-colors rounded-t-lg ${
                activeTab === t.id
                  ? 'text-accent border-b-2 border-accent bg-white/5'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 옵션 패널 — 탭 전환 시 높이 고정 (펫 탭은 항목 많아 더 큼) */}
        <div className={`overflow-y-auto px-4 py-4 ${activeTab === 'pet' ? 'h-[280px]' : 'h-[200px]'}`}>
          {activeTab === 'body' && (
            <ColorGrid
              items={BODY_COLORS}
              selected={bodyColor}
              onSelect={setBodyColor}
            />
          )}
          {activeTab === 'skin' && (
            <ColorGrid
              items={SKIN_COLORS}
              selected={skinColor}
              onSelect={setSkinColor}
            />
          )}
          {activeTab === 'hair' && (
            <ColorGrid
              items={HAIR_COLORS}
              selected={hairColor}
              onSelect={setHairColor}
            />
          )}
          {activeTab === 'hairStyle' && (
            <div className="grid grid-cols-5 gap-2">
              {HAIR_STYLES.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setHairStyle(h.id)}
                  className={`flex flex-col items-center gap-1 rounded-xl p-2 transition-all ${
                    hairStyle === h.id
                      ? 'bg-accent/20 ring-2 ring-accent'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-center" style={{ width: 36, height: 45 }}>
                    <CharacterSVG
                      color={bodyColor}
                      skinColor={skinColor}
                      hairColor={hairColor}
                      hairStyle={h.id}
                      accessory={accessory}
                      size={28}
                    />
                  </div>
                  <span className="text-[10px] text-text-secondary">{h.label}</span>
                </button>
              ))}
            </div>
          )}
          {activeTab === 'accessory' && (
            <div className="grid grid-cols-3 gap-2">
              {ACCESSORIES.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAccessory(a.id)}
                  className={`flex flex-col items-center gap-1 rounded-xl p-2 transition-all ${
                    accessory === a.id
                      ? 'bg-accent/20 ring-2 ring-accent'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-center" style={{ width: 36, height: 45 }}>
                    <CharacterSVG
                      color={bodyColor}
                      skinColor={skinColor}
                      hairColor={hairColor}
                      hairStyle={hairStyle}
                      accessory={a.id}
                      size={28}
                    />
                  </div>
                  <span className="text-[10px] text-text-secondary">{a.emoji} {a.label}</span>
                </button>
              ))}
            </div>
          )}
          {activeTab === 'pet' && (
            <div className="grid grid-cols-4 gap-2">
              {PETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPet(p.id)}
                  className={`flex flex-col items-center gap-1 rounded-xl p-2 transition-all ${
                    pet === p.id
                      ? 'bg-accent/20 ring-2 ring-accent'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className="text-lg">{p.emoji}</span>
                  <span className="text-[10px] text-text-secondary">{p.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 저장 */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs text-text-muted hover:bg-white/5 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent/80 disabled:opacity-50"
          >
            <Check size={14} />
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** 색상 선택 그리드 */
function ColorGrid({
  items,
  selected,
  onSelect,
}: {
  items: readonly { id: string; hex: string; label: string }[];
  selected: string;
  onSelect: (hex: string) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {items.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.hex)}
          className={`group flex flex-col items-center gap-1 rounded-xl p-2 transition-all ${
            selected === c.hex
              ? 'bg-white/10 ring-2 ring-accent'
              : 'hover:bg-white/5'
          }`}
          title={c.label}
        >
          <div
            className="h-7 w-7 rounded-full transition-transform group-hover:scale-110"
            style={{ backgroundColor: c.hex, boxShadow: selected === c.hex ? `0 0 8px ${c.hex}80` : undefined }}
          />
          <span className="text-[10px] text-text-muted">{c.label}</span>
        </button>
      ))}
    </div>
  );
}
