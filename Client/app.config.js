module.exports = {
    expo: {
        name: "client",
        slug: "client",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        splash: {
            image: "./assets/splash.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        assetBundlePatterns: [
            "**/*"
        ],
        ios: {
            supportsTablet: true
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#ffffff"
            }
        },
        web: {
            favicon: "./assets/favicon.png"
        },
        extra: {
            eas: {
                projectId: "your-project-id"
            }
        },
        // Add HTTPS configuration
        developmentClient: {
            silentLaunch: true
        },
        // Configure HTTPS for development
        scheme: "https",
        // Add development server configuration
        developer: {
            tool: "expo-cli"
        },
        // Add SSL configuration
        ssl: {
            key: "../Server/certs/localhost-key.pem",
            cert: "../Server/certs/localhost.pem"
        }
    }
}; 