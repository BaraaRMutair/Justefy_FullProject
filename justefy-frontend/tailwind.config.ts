import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./main/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],

    theme: {
        container: {
            center: true,
            padding: {
                DEFAULT: "1rem",
                sm: "1.5rem",
                lg: "2rem",
                xl: "2.5rem",
                "2xl": "3rem",
            },
            screens: {
                "2xl": "1400px",
            },
        },

        extend: {
            colors: {
                justefy: {
                    50: "#fff7ed",
                    100: "#ffedd5",
                    200: "#fed7aa",
                    300: "#fdba74",
                    400: "#fb923c",
                    500: "#f97316",
                    600: "#ea580c",
                    700: "#c2410c",
                    800: "#9a3412",
                    900: "#7c2d12",
                },
            },

            fontFamily: {
                sans: ["var(--font-alexandria)"],
            },

            backgroundImage: {
                "hero-gradient":
                    "radial-gradient(circle at top, rgba(249,115,22,0.12), transparent 40%), linear-gradient(to bottom, #ffffff, #fff7ed)",

                "orange-glow":
                    "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
            },

            boxShadow: {
                soft: "0 10px 30px rgba(0,0,0,0.08)",

                glow: "0 0 40px rgba(249,115,22,0.25)",

                card: "0 8px 32px rgba(15, 23, 42, 0.08)",
            },

            borderRadius: {
                "4xl": "2rem",
            },

            animation: {
                float: "float 6s ease-in-out infinite",
                glow: "glow 2.5s ease-in-out infinite alternate",
                "fade-up": "fadeUp 0.7s ease-out forwards",
            },

            keyframes: {
                float: {
                    "0%, 100%": {
                        transform: "translateY(0px)",
                    },
                    "50%": {
                        transform: "translateY(-12px)",
                    },
                },

                glow: {
                    from: {
                        boxShadow: "0 0 20px rgba(249,115,22,0.15)",
                    },
                    to: {
                        boxShadow: "0 0 40px rgba(249,115,22,0.35)",
                    },
                },

                fadeUp: {
                    from: {
                        opacity: "0",
                        transform: "translateY(20px)",
                    },
                    to: {
                        opacity: "1",
                        transform: "translateY(0)",
                    },
                },
            },

            backdropBlur: {
                xs: "2px",
            },

            transitionTimingFunction: {
                smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
            },
        },
    },

    plugins: [],
};

export default config;