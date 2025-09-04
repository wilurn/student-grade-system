import React, { ReactNode, useState, useEffect } from 'react';
import { Header, HeaderProps } from './Header';
import { Navigation, NavigationItem } from './Navigation';
import './Layout.css';

export interface LayoutProps {
    children: ReactNode;
    headerProps: HeaderProps;
    navigationItems?: NavigationItem[];
    activeNavigationItem?: string;
    onNavigate?: (path: string, itemId?: string) => void;
    showNavigation?: boolean;
    className?: string;
}

export const Layout: React.FC<LayoutProps> = ({
    children,
    headerProps,
    navigationItems = [],
    activeNavigationItem,
    onNavigate,
    showNavigation = true,
    className = ''
}) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isNavigationCollapsed, setIsNavigationCollapsed] = useState(false);

    // Check for mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleNavigate = (path: string, itemId?: string) => {
        if (onNavigate) {
            onNavigate(path, itemId);
        }
    };

    const handleNavigationToggle = () => {
        setIsNavigationCollapsed(!isNavigationCollapsed);
    };

    const layoutClasses = [
        'layout',
        className,
        showNavigation ? 'layout--with-navigation' : 'layout--no-navigation',
        isMobile ? 'layout--mobile' : 'layout--desktop',
        isNavigationCollapsed ? 'layout--navigation-collapsed' : ''
    ].filter(Boolean).join(' ');

    return (
        <div className={layoutClasses}>
            <Header
                {...headerProps}
                onNavigate={handleNavigate}
            />

            <div className="layout__body">
                {showNavigation && navigationItems.length > 0 && headerProps.user && (
                    <aside className="layout__sidebar">
                        <Navigation
                            items={navigationItems}
                            activeItem={activeNavigationItem}
                            onNavigate={handleNavigate}
                            isMobile={isMobile}
                            isCollapsed={isNavigationCollapsed}
                            onToggle={handleNavigationToggle}
                        />
                    </aside>
                )}

                <main className="layout__main" role="main">
                    <div className="layout__content">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;