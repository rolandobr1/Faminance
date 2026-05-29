# **App Name**: Faminance

## Core Features:

- Transaction Logging: Manually input income and expenses, including amount, category, payment method, optional description, and receipt image upload to Firebase Storage.
- Budget Creation & Management: Establish budgets for various categories with defined periods (monthly, weekly, annual). Set spending limits and receive alerts when approaching the budget limit.
- Family Role Management: Configure family member roles (Admin/User) using Firebase Authentication. Admins can view all financial data, while Users can only view and log their own transactions.
- Allowance Assignments: Parents (Admins) can assign fixed or variable allowances to children (Users), tracking spending against assigned amounts.
- Shared Expense Tracking: Log expenses as 'shared,' dividing the amount among selected family members and tracking who covered which portion.
- AI-Powered Budget Suggestion Tool: Uses a generative AI LLM as a tool that analyzes historical spending data to suggest personalized budget adjustments for different categories, assisting users in efficient budgeting.
- Savings Goal Visualization: Set individual or family savings goals with target amounts and dates, associating them with specific accounts and tracking progress visually.

## Style Guidelines:

- Primary color: Gentle Blue (#64B5F6), reflecting trust and stability for financial management.
- Background color: Very light blue (#E3F2FD), providing a calm and uncluttered backdrop.
- Accent color: Warm Orange (#FFB74D), used for calls to action and important notifications, adding a touch of warmth.
- Font pairing: 'Poppins' (sans-serif) for headlines and short text snippets, combined with 'PT Sans' (sans-serif) for body text, ensuring readability.
- Simple, consistent icons for categories, transactions, and menu items. Use a line style to maintain a clean and modern aesthetic.
- Dashboard provides at-a-glance overview of key metrics. Consistent spacing and padding for easy navigation.
- Subtle transitions and animations when navigating between sections or updating data, enhancing user engagement.