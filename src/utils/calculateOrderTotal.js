const calculateOrderTotal = (items) => {
    return items.reduce((sum, item) => {
        return sum + item.unitPrice * item.quantity;
    }, 0);
};

export default calculateOrderTotal;
