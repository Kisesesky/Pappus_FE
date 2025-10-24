// components/views/settings/SettingsModal.tsx
'use client';

import { useMemo, useState } from 'react';
import Modal from '@/components/common/Modal';
import {
  Bell, Monitor, ShieldCheck, User, Pencil
} from 'lucide-react';
import clsx from 'clsx';

type Props = { open: boolean; onClose: () => void };

// 왼쪽 네비 + 신규 뱃지
const NAV = [
  { id: 'account', label: '계정', icon: User },
  { id: 'notifications', label: '알림', icon: Bell, badge: 'N' },
  { id: 'display', label: '디스플레이 설정', icon: Monitor },
  { id: 'security', label: '보안', icon: ShieldCheck },
];

export default function SettingsModal({ open, onClose }: Props) {
  const [active, setActive] = useState('account');

  // 예시 데이터 (스토어 연동 시 교체)
  const profile = useMemo(() => ({
    name: '한성호',
    email: 'kiseesky08@gmail.com',
    company: 'flfo',
    dept: '',
    title: '',
  }), []);

  return (
    <Modal open={open} onClose={onClose} title="환경설정" widthClass="max-w-5xl" className="overflow-hidden">
      {/* 상단 라이트 그레이 헤더 바 */}
      <div className="w-full bg-zinc-100 border-b"></div>

      <div className="flex">
        {/* 좌측: 아이콘 + 탭 */}
        <aside className="w-64 bg-white">
          <div className="px-5 py-6 border-r">
            {/* 아바타 큰 원 + 연필 아이콘 */}
            <div className="relative mx-auto h-20 w-20 rounded-2xl bg-orange-400 text-white flex items-center justify-center text-2xl font-bold">
              성호
              <button className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-white shadow flex items-center justify-center">
                <Pencil size={16} className="text-zinc-700" />
              </button>
            </div>
            <div className="mt-6">
              <ul className="space-y-1">
                {NAV.map(item => (
                  <li key={item.id}>
                    <button
                      onClick={() => setActive(item.id)}
                      className={clsx(
                        'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-zinc-100',
                        active === item.id ? 'bg-zinc-100 font-medium' : 'text-zinc-700'
                      )}
                    >
                      <span className="inline-flex items-center gap-2">
                        <item.icon size={16} />
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="ml-2 inline-flex h-5 min-w-[18px] items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* 우측: 콘텐츠 */}
        <main className="flex-1">
          {/* 상단 연한 그레이 헤더 영역 (이미지처럼) */}
          <div className="h-14 bg-zinc-100 border-b flex items-center px-6">
            <h3 className="text-base font-semibold">환경설정</h3>
          </div>

          {/* 본문 */}
          <div className="p-6 space-y-8">
            {active === 'account' && (
              <section>
                <div className="divide-y border rounded-xl overflow-hidden">
                  <Row label="이용중인 버전" value="비즈니스 버전" />
                  <Row label="아이디" value={profile.email} />
                  <Row label="이름" value={profile.name} editable />
                  <Row label="회사명" value={profile.company} />
                  <Row label="부서" value={profile.dept} editable />
                  <Row label="직책" value={profile.title} editable />
                </div>
              </section>
            )}

            {active === 'notifications' && (
              <section className="space-y-4">
                <ToggleRow label="채널 멘션 알림" defaultChecked />
                <ToggleRow label="DM 알림" defaultChecked />
                <ToggleRow label="이메일 알림" />
              </section>
            )}

            {active === 'display' && (
              <section>
                <div className="text-sm font-medium mb-3">테마</div>
                <div className="space-y-2">
                  <RadioRow name="theme" label="라이트" defaultChecked />
                  <RadioRow name="theme" label="다크" />
                  <RadioRow name="theme" label="시스템 기본" />
                </div>
              </section>
            )}

            {active === 'security' && (
              <section className="space-y-3">
                <button className="rounded-md bg-brand text-white px-3 py-2 text-sm">비밀번호 변경</button>
                <button className="rounded-md border px-3 py-2 text-sm">2단계 인증 설정</button>
              </section>
            )}
          </div>
        </main>
      </div>
    </Modal>
  );
}

function Row({ label, value, editable }: { label: string; value: string; editable?: boolean }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white">
      <div>
        <div className="text-xs text-zinc-500 mb-1">{label}</div>
        <div className="text-sm">{value || <span className="text-zinc-400">-</span>}</div>
      </div>
      {editable && (
        <button className="text-zinc-500 hover:text-zinc-800">
          <Pencil size={16} />
        </button>
      )}
    </div>
  );
}

function ToggleRow({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm bg-white">
      <span>{label}</span>
      <input type="checkbox" className="accent-brand h-4 w-4" defaultChecked={defaultChecked} />
    </label>
  );
}

function RadioRow({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm bg-white">
      <span>{label}</span>
      <input type="radio" name={name} className="accent-brand h-4 w-4" defaultChecked={defaultChecked} />
    </label>
  );
}
