
export const PaymentSimulator = {
  simulateDeposit: async (amount, method, phone) => {
    return new Promise((resolve, reject) => {
      // Simulate network delay
      setTimeout(() => {
        if (Math.random() < 0.05) {
          reject(new Error("La transaction a échoué auprès de l'opérateur."));
        } else {
          resolve({
            transactionId: 'TX' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            date: new Date().toISOString(),
            amount: parseFloat(amount),
            method,
            phone,
            status: 'complete'
          });
        }
      }, 2000);
    });
  },

  generateReceipt: (transaction, balanceBefore, balanceAfter) => {
    return {
      ...transaction,
      receiptId: 'RC' + Date.now().toString().slice(-6),
      balanceBefore,
      balanceAfter
    };
  }
};
