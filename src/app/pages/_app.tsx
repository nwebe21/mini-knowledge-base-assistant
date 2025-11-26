// pages/_app.tsx
import { UserProvider } from "@/context/UserContext";

export default function App({ Component, pageProps }: any) {
    return (
        <UserProvider>
            <Component {...pageProps} />
        </UserProvider>
    );
}