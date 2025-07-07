import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import NumberFlowLite, {
  type Value,
  type Format,
  type Props as CoreProps,
  formatToData,
  type Data,
  // We'll use React Native's way of handling motion preference
  // prefersReducedMotion as _prefersReducedMotion,
  // canAnimate as _canAnimate,
} from 'number-flow/lite';
import { numberFlowStyles, partStyles, charStyles } from './styles'; // Assuming styles will be defined here

// React Native doesn't use custom elements in the same way web does.
// We'll create a standard React Native component.

type BaseProps = Partial<CoreProps> & {
  style?: object; // Allow passing custom styles
  textStyle?: object; // Allow passing custom styles for text parts
  onAnimationsStart?: () => void;
  onAnimationsFinish?: () => void;
};

export type NumberFlowProps = BaseProps & {
  value: Value;
  locales?: Intl.LocalesArgument;
  format?: Format;
  prefix?: string;
  suffix?: string;
};

// Store formatters to reuse
const formatters: Record<string, Intl.NumberFormat> = {};

const NumberFlow: React.FC<NumberFlowProps> = ({
  value,
  locales,
  format,
  prefix = '',
  suffix = '',
  style,
  textStyle,
  // Core props with defaults from NumberFlowLite if applicable
  transformTiming = NumberFlowLite.defaultProps.transformTiming,
  spinTiming = NumberFlowLite.defaultProps.spinTiming,
  opacityTiming = NumberFlowLite.defaultProps.opacityTiming,
  animated = NumberFlowLite.defaultProps.animated,
  respectMotionPreference = NumberFlowLite.defaultProps.respectMotionPreference, // This might need platform-specific handling
  trend = NumberFlowLite.defaultProps.trend,
  plugins = NumberFlowLite.defaultProps.plugins,
  onAnimationsStart,
  onAnimationsFinish,
}) => {
  const [currentData, setCurrentData] = React.useState<Data | null>(null);
  const previousDataRef = React.useRef<Data | null>(null);
  const numberFlowInstanceRef = React.useRef<NumberFlowLite | null>(null);
  const containerRef = React.useRef<View>(null);

  React.useEffect(() => {
    const localesString = locales ? JSON.stringify(locales) : '';
    const formatString = format ? JSON.stringify(format) : '';
    const formatter = (formatters[`${localesString}:${formatString}`] ??= new Intl.NumberFormat(
      locales,
      format
    ));
    const newData = formatToData(value, formatter, prefix, suffix);

    previousDataRef.current = currentData;
    setCurrentData(newData);
  }, [value, locales, format, prefix, suffix, currentData]);

  React.useEffect(() => {
    if (containerRef.current && currentData) {
      if (!numberFlowInstanceRef.current) {
        // @ts-ignore ref is not a HTMLElement
        numberFlowInstanceRef.current = new NumberFlowLite(containerRef.current as unknown as HTMLElement, { // TODO: This is a hack, need to adapt NumberFlowLite or create a RN specific core
          transformTiming,
          spinTiming,
          opacityTiming,
          animated,
          respectMotionPreference,
          trend,
          plugins,
        });
        if (onAnimationsStart) {
            // @ts-ignore
          numberFlowInstanceRef.current.addEventListener('animationsstart', onAnimationsStart);
        }
        if (onAnimationsFinish) {
            // @ts-ignore
          numberFlowInstanceRef.current.addEventListener('animationsfinish', onAnimationsFinish);
        }
      }

      const instance = numberFlowInstanceRef.current;
      // Update props
      instance.transformTiming = transformTiming;
      instance.spinTiming = spinTiming;
      instance.opacityTiming = opacityTiming;
      instance.animated = animated;
      instance.respectMotionPreference = respectMotionPreference; // Consider AccessibilityInfo for React Native
      instance.trend = trend;
      instance.plugins = plugins;

      if (previousDataRef.current) {
        instance.willUpdate();
        instance.data = currentData;
        instance.didUpdate();
      } else {
        instance.data = currentData;
      }
    }
  }, [currentData, transformTiming, spinTiming, opacityTiming, animated, respectMotionPreference, trend, plugins, onAnimationsStart, onAnimationsFinish]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (numberFlowInstanceRef.current) {
        if (onAnimationsStart) {
            // @ts-ignore
          numberFlowInstanceRef.current.removeEventListener('animationsstart', onAnimationsStart);
        }
        if (onAnimationsFinish) {
            // @ts-ignore
          numberFlowInstanceRef.current.removeEventListener('animationsfinish', onAnimationsFinish);
        }
        // Potentially call a cleanup method on numberFlowInstance if it exists
      }
    };
  }, [onAnimationsStart, onAnimationsFinish]);

  if (!currentData) {
    return null; // Or a placeholder
  }

  // NumberFlowLite renders HTML structure. We need to adapt this to React Native components.
  // This is a simplified representation. The actual rendering logic of NumberFlowLite
  // involves creating individual elements for digits, characters, etc., and applying animations.
  // For React Native, we'd iterate over `currentData.parts` and render `Text` components,
  // and then try to replicate the animation logic.

  // TODO: This rendering part is the most complex to adapt.
  // NumberFlowLite manipulates DOM elements directly for animations.
  // React Native requires a different approach, likely using Animated API or a library like Reanimated.
  // For a first pass, we'll render the numbers without complex animations.
  // The core `number-flow/lite` might need a platform-agnostic animation driver
  // or a React Native specific animation implementation.

  const allParts = currentData ? [
    ...currentData.pre,
    ...currentData.integer,
    ...currentData.fraction,
    ...currentData.post,
  ] : [];

  return (
    <View ref={containerRef} style={[styles.container, style, { flexDirection: 'row' }]}>
      {allParts.map((part) => (
        <Text key={part.key} style={[partStyles.part, textStyle]}>
          {String(part.value)}
        </Text>
      ))}
    </View>
  );
};

// Basic styles - these would ideally come from number-flow/src/styles.ts adaptations
const styles = StyleSheet.create({
  container: {
    // from .number-flow in styles.css
    position: 'relative',
    display: 'flex', // In RN, View is flex by default
    overflow: 'hidden',
  },
  part: {
    // from .part in styles.css
    position: 'relative', // Not directly applicable in RN in the same way
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    // --duration, --delay, --ease would be handled by animation logic
  },
  // Further style adaptations would be needed for .char, .digit, .symbol etc.
});


export default NumberFlow;

// Note: The NumberFlowGroup functionality from the React package would also need a React Native adaptation.
// This initial version does not include it.
// The core animation logic of NumberFlowLite, which directly manipulates DOM elements and CSS,
// is the biggest hurdle for a direct port. A significant refactor of the animation driver
// or a React Native specific implementation using Animated/Reanimated would be required for full fidelity.
// This current implementation aims to get the basic structure and number formatting working.
// The `numberFlowInstanceRef.current = new NumberFlowLite(...)` will likely not work as expected
// because NumberFlowLite expects an HTMLElement and manipulates the DOM.
// This will require a deeper integration or abstraction in `number-flow/lite`.
// For now, this serves as a structural placeholder.
// Consider using a simpler rendering if NumberFlowLite cannot be easily adapted:
// render the text directly and investigate how to bring animations later.
// The `dangerouslySetInnerHTML` equivalent for RN is not straightforward for complex HTML.
// We are rendering text parts directly.
// The `willUpdate` and `didUpdate` calls on the instance are also tied to DOM.
// The `plugins` system would also need careful adaptation.
// `respectMotionPreference` should use `AccessibilityInfo.isReduceMotionEnabled` in React Native.
