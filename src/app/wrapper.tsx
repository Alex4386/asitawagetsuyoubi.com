"use client";

import { useMonday } from "@/hooks/useMonday";
import Providers from "./Providers";
import './global.css';

export default function RootWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const monday = useMonday();
    
    return <html lang="ja" style={{
        backgroundColor: monday.canTeaseOmaera ? 'var(--panel-background)' : 'var(--panel-background-not-monday)'
    }}>
        <body>
            {children}
        </body>
    </html>;
}