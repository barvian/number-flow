# NumberFlow for React Native

This package provides a React Native component for [NumberFlow](https://number-flow.barvian.me/), an animated number component.

## Installation

```bash
npm install number-flow-react-native number-flow
# or
yarn add number-flow-react-native number-flow
# or
pnpm add number-flow-react-native number-flow
```

## Usage

```tsx
import React from 'react';
import { View } from 'react-native';
import NumberFlow from 'number-flow-react-native';

const App = () => {
  const [value, setValue] = React.useState(100);

  // Change value after 3 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setValue(500);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <NumberFlow value={value} />
    </View>
  );
};

export default App;
```

For more detailed documentation and examples, please visit the main [NumberFlow documentation](https://number-flow.barvian.me).
