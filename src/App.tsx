/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameCanvas } from './components/GameCanvas';

export default function App() {
  return (
    <main className="w-screen h-[100dvh] overflow-hidden bg-black font-sans antialiased">
      <GameCanvas />
    </main>
  );
}
