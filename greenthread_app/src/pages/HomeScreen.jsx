import React from "react";
import {
    Button
} from "@mui/material";
import { motion } from "framer-motion";

const stats = [
    { number: "85%", label: "Recycled Materials" },
    { number: "100k+", label: "Trees Planted" },
    { number: "50%", label: "Less Water Usage" },
    { number: "0", label: "Plastic Packaging" },
];

const HomeScreen = () => {
    return (
        <main className="bg-eco-light min-h-screen">
            {/* Hero Section */}
            <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-eco-light">

                <div className="container relative z-10 px-4 py-32 mx-auto text-center">

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mb-8 text-5xl md:text-7xl font-bold tracking-tight text-eco-dark"
                    >
                        EcoStyle Clothing
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="mx-auto mb-10 text-lg md:text-xl text-eco-dark/80 max-w-2xl"
                    >
                        Where style meets sustainability. Discover our collection of eco-friendly fashion that makes a statement without compromising our planet.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <Button
                            size="lg"
                            className="bg-eco-dark hover:bg-eco-dark/90 text-white px-8 py-6 text-lg transition-all duration-300 ease-out hover:scale-105"
                        >
                            Shop Collection
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="border-eco-dark text-eco-dark hover:bg-eco-dark hover:text-white px-8 py-6 text-lg transition-all duration-300 ease-out hover:scale-105"
                        >
                            Learn More
                        </Button>
                    </motion.div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="py-24 bg-white">
                <div className="container px-4 mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="text-center p-6 rounded-2xl bg-eco-light/50 backdrop-blur-sm animate-float"
                            >
                                <h3 className="text-4xl font-bold text-eco-dark mb-2">{stat.number}</h3>
                                <p className="text-eco-dark/70">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* About Section */}
            <div className="py-24 bg-eco-light">
                <div className="container px-4 mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="max-w-3xl mx-auto text-center"
                    >
                        <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium tracking-wider text-eco-dark uppercase bg-white rounded-full">
                            Our Mission
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold text-eco-dark mb-8 leading-tight">
                            Sustainable Fashion for a Better Tomorrow
                        </h2>
                        <p className="text-lg text-eco-dark/80 leading-relaxed mb-10">
                            At EcoStyle Clothing, we believe fashion should be as kind to the planet as it is to your wardrobe.
                            Our commitment to sustainability goes beyond just using eco-friendly materials - we're revolutionizing
                            the entire fashion industry through innovative practices and conscious design.
                        </p>
                    </motion.div>
                </div>
            </div>
        </main>
    );
};

export default HomeScreen;