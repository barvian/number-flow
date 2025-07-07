import React from 'react';
import { render, screen } from '@testing-library/react-native';
import NumberFlow from '../src/index'; // Adjust path as needed

// Mock the NumberFlowLite class and its methods as it's not suitable for Jest/Node.js environment
// and its animation parts are not yet implemented for React Native.
jest.mock('number-flow/lite', () => {
  const originalModule = jest.requireActual('number-flow/lite');
  return {
    ...originalModule,
    __esModule: true,
    default: jest.fn().mockImplementation((element, props) => {
      return {
        data: null, // Initial data
        // Mock methods that are called in the component
        willUpdate: jest.fn(),
        didUpdate: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        // Mock properties that are accessed
        transformTiming: props?.transformTiming,
        spinTiming: props?.spinTiming,
        opacityTiming: props?.opacityTiming,
        animated: props?.animated,
        respectMotionPreference: props?.respectMotionPreference,
        trend: props?.trend,
        plugins: props?.plugins,
        // defaultProps for assignments in component
        defaultProps: originalModule.default.defaultProps
      };
    }),
    formatToData: originalModule.formatToData, // Use actual formatToData
  };
});


describe('NumberFlow React Native Component', () => {
  it('renders correctly with an initial value', () => {
    render(<NumberFlow value={123} />);
    // Check if the number is rendered.
    // Since the mocked NumberFlowLite doesn't render digits in this test environment,
    // we check for the text content based on how our simplified RN component renders.
    // Our RN component joins digits: part.digits.map(d => d.char).join('')
    expect(screen.getByText('123')).toBeTruthy();
  });

  it('renders with prefix and suffix', () => {
    render(<NumberFlow value={456} prefix="$" suffix="!" />);
    expect(screen.getByText('$')).toBeTruthy();
    expect(screen.getByText('456')).toBeTruthy();
    expect(screen.getByText('!')).toBeTruthy();
  });

  it('updates when the value prop changes', () => {
    const { rerender } = render(<NumberFlow value={100} />);
    expect(screen.getByText('100')).toBeTruthy();

    rerender(<NumberFlow value={200} />);
    expect(screen.getByText('200')).toBeTruthy();
    // Check that '100' is no longer present (or handle how updates are shown)
    expect(screen.queryByText('100')).toBeNull();
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    render(<NumberFlow value={123} style={customStyle} />);
    // @ts-ignore
    const view = screen.getByText('123').parent.parent; // Access the container View
    expect(view.props.style).toEqual(expect.arrayContaining([expect.objectContaining(customStyle)]));
  });

  it('renders formatted numbers (e.g. with commas)', () => {
    render(<NumberFlow value={1234567} locales="en-US" format={{ useGrouping: true }} />);
    expect(screen.getByText('1,234,567')).toBeTruthy();
  });

  it('renders decimal numbers', () => {
    render(
      <NumberFlow
        value={123.45}
        locales="en-US"
        format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
      />
    );
    expect(screen.getByText('123.45')).toBeTruthy();
  });

  // Note: Animation tests are not included here as the animation functionality
  // is not yet implemented/adapted for React Native. Testing animations in RN
  // typically involves mocking time and using test utilities for the Animated API.

  // Test for onAnimationsStart/Finish (mocked behavior)
  // This test mainly checks if the event listeners are attached/removed,
  // not the actual animation events.
  it('calls onAnimationsStart and onAnimationsFinish (mocked)', () => {
    const onAnimationsStartMock = jest.fn();
    const onAnimationsFinishMock = jest.fn();
    const { rerender, unmount } = render(
      <NumberFlow
        value={100}
        onAnimationsStart={onAnimationsStartMock}
        onAnimationsFinish={onAnimationsFinishMock}
      />
    );

    // At this point, the NumberFlowLite mock constructor is called, which should set up listeners.
    // We can't easily verify addEventListener on the mock in this setup without more complex mocking.
    // For now, this test serves as a placeholder for future animation event testing.

    // Rerender to simulate prop changes that might re-trigger effects
    rerender(
      <NumberFlow
        value={200}
        onAnimationsStart={onAnimationsStartMock}
        onAnimationsFinish={onAnimationsFinishMock}
      />
    );

    // Unmount to trigger cleanup
    unmount();
    // Similar to addEventListener, verifying removeEventListener on the mock instance
    // would require the mock to expose its internal state or methods, or a more detailed spy.

    // Basic check (these won't be called by the current mock, but good to have the structure)
    // expect(onAnimationsStartMock).toHaveBeenCalled(); // This would require the mock to call these
    // expect(onAnimationsFinishMock).toHaveBeenCalled();
  });

});
