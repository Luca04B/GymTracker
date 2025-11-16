const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  output: "export",
  basePath: isProd ? "/GymTracker" : "",
  assetPrefix: isProd ? "/GymTracker/" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
