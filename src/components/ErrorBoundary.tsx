import { Component } from 'react';
import type { ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-950 p-6 text-center text-gray-100">
        <p className="text-lg font-semibold">Có lỗi xảy ra khiến trang không hiển thị được.</p>
        <p className="text-sm text-gray-400">Tiến độ học của bạn vẫn được giữ. Hãy tải lại trang.</p>
        <button onClick={() => location.reload()} className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">Tải lại trang</button>
      </div>
    );
  }
}
