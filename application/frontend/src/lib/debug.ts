// Debug utilities optimized for Claude Code visibility
export const DEBUG = {
  enabled: process.env.NODE_ENV === 'development',
  
  log: (component: string, action: string, data?: any) => {
    if (!DEBUG.enabled) return;
    
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    const prefix = `[${timestamp}] ${component}::${action}`;
    
    if (data) {
      console.log(`${prefix}:`, data);
    } else {
      console.log(prefix);
    }
  },
  
  state: (component: string, stateName: string, value: any) => {
    DEBUG.log(component, `state.${stateName}`, value);
  },
  
  error: (component: string, error: Error | string) => {
    console.error(`[ERROR] ${component}:`, error);
  },
  
  render: (component: string, props?: any) => {
    DEBUG.log(component, 'render', props ? Object.keys(props) : undefined);
  }
};