import { styles } from '../styles/pagerStyles';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { createNavigatorFactory, TabRouter, useNavigationBuilder } from '@react-navigation/native';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { SafeAreaProviderCompat } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function PagerNavigator(props) {
  const { state, descriptors, navigation, NavigationContent } = useNavigationBuilder(TabRouter, props);
  const insets = useSafeAreaInsets();
  const pager = useRef(null);
  // These refs track native commands, not a second React navigation state.
  const nativePage = useRef(state.index);
  const initialPage = useRef(state.index);
  const pendingPage = useRef(null);

  const selectPage = index => {
    pendingPage.current = index;
    pager.current?.setPage(index);
  };

  // Also support navigation.navigate() from within an existing screen and back actions.
  useEffect(() => {
    if (state.index !== nativePage.current) selectPage(state.index);
  }, [state.index]);

  useEffect(() => {
    const unsubscribe = state.routes.map((route, index) =>
      descriptors[route.key].navigation.addListener('tabPress', event => {
        event.preventDefault();
        selectPage(index);
      })
    );
    return () => unsubscribe.forEach(remove => remove());
  }, [descriptors, state.routes]);

  return <NavigationContent>
    <SafeAreaProviderCompat style={styles.container}>
      <PagerView
        ref={pager}
        style={styles.container}
        initialPage={initialPage.current}
        orientation="horizontal"
        offscreenPageLimit={2}
        keyboardDismissMode="on-drag"
        onPageScrollStateChanged={({ nativeEvent }) => {
          // A new finger gesture supersedes an in-flight tab command.
          if (nativeEvent.pageScrollState === 'dragging') pendingPage.current = null;
        }}
        onPageSelected={({ nativeEvent: { position } }) => {
          nativePage.current = position;
          if (pendingPage.current !== null && pendingPage.current !== position) return;
          pendingPage.current = null;
          if (position !== state.index) navigation.jumpTo(state.routes[position].name);
        }}
      >
        {state.routes.map((route, index) => <View
          key={route.key}
          collapsable={false}
          style={styles.page}
          accessibilityElementsHidden={index !== state.index}
          importantForAccessibility={index === state.index ? 'auto' : 'no-hide-descendants'}
        >
          {descriptors[route.key].render()}
        </View>)}
      </PagerView>
      <BottomTabBar state={state} descriptors={descriptors} navigation={navigation} insets={insets} />
    </SafeAreaProviderCompat>
  </NavigationContent>;
}



export const createPagerNavigator = createNavigatorFactory(PagerNavigator);
