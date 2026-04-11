import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <ScrollViewStyleReset />

        {/* Force font-display:swap so icons show after font loads instead of being hidden */}
        <style dangerouslySetInnerHTML={{ __html: fontFix }} />

        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const fontFix = `
@font-face {
  font-family: 'FontAwesome';
  src: url('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome.b06871f281fee6b241d60582ae9369b9.ttf') format('truetype');
  font-display: swap;
}
@font-face {
  font-family: 'SpaceMono';
  src: url('/assets/assets/fonts/SpaceMono-Regular.49a79d66bdea2debf1832bf4d7aca127.ttf') format('truetype');
  font-display: swap;
}
`;

const responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}`;
