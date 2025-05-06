# Trading Analysis Web Application

A comprehensive web application for technical analysis of stocks, built with Next.js and TypeScript.

## Features

- Interactive candlestick charts with multiple timeframes
- Technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands)
- Support and Resistance levels
- Fibonacci Retracement tools
- Volume analysis
- Risk management tools (Stop Loss, Take Profit)
- Mobile-responsive design

## Prerequisites

- Node.js 18.x or later
- npm 9.x or later

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd trading-analysis-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your environment variables:
```env
NEXT_PUBLIC_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_CONFIG=your_firebase_config
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Chart.tsx
│   ├── TechnicalIndicators.tsx
│   ├── TimeframeSelector.tsx
│   ├── SupportResistance.tsx
│   ├── FibonacciRetracement.tsx
│   ├── VolumeAnalysis.tsx
│   └── RiskManagement.tsx
└── lib/
    └── api.ts
```

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- Lightweight Charts
- Technical Indicators
- NextAuth.js
- Firebase

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 