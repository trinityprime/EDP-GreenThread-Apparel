import { useEffect } from "react";

const Chatbot = () => {
    useEffect(() => {
        if (!window.chatbase) {
            window.chatbase = (...args) => {
                if (!window.chatbase.q) {
                    window.chatbase.q = [];
                }
                window.chatbase.q.push(args);
            };

            window.chatbase = new Proxy(window.chatbase, {
                get(target, prop) {
                    if (prop === "q") return target.q;
                    return (...args) => target(prop, ...args);
                },
            });

            const script = document.createElement("script");
            script.src = "https://www.chatbase.co/embed.min.js";
            script.id = "TyOhiqv407oSivenvV_6q"; // Replace with your actual Chatbase bot ID
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    return null; // No UI element, just the script loader
};

export default Chatbot;
