import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#079875", dark: "#06765d", light: "#e9f8f3", contrastText: "#ffffff" },
    secondary: { main: "#16335b" },
    background: { default: "#f8fafc", paper: "#ffffff" },
    text: { primary: "#17324d", secondary: "#64748b" },
    divider: "#e3eaf0",
    warning: { main: "#f5a623" },
  },
  typography: {
    fontFamily: 'Inter, Manrope, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontWeight: 800, letterSpacing: "-0.035em" },
    h2: { fontWeight: 800, letterSpacing: "-0.025em" },
    h3: { fontWeight: 750, letterSpacing: "-0.015em" },
    button: { fontWeight: 700, textTransform: "none" },
  },
  shape: { borderRadius: 12 },
  spacing: 8,
  breakpoints: { values: { xs: 0, sm: 600, md: 768, lg: 1024, xl: 1440 } },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 44, borderRadius: 9, paddingInline: 18, transition: "transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease" },
        containedPrimary: { boxShadow: "0 8px 22px rgba(7,152,117,.18)", "&:hover": { transform: "translateY(-1px)", boxShadow: "0 12px 26px rgba(7,152,117,.24)" } },
      },
    },
    MuiCard: { styleOverrides: { root: { border: "1px solid #e3eaf0", boxShadow: "0 8px 26px rgba(23,50,77,.055)" } } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 9, backgroundColor: "#fff", "&.Mui-focused": { boxShadow: "0 0 0 2px rgba(7,152,117,.08)" } } } },
  },
});

export default theme;
