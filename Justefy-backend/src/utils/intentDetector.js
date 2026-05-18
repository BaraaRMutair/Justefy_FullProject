const detectIntent = (message) => {
  const msg = (message || '').toLowerCase();

  if (
    msg.includes("بدي خدمة") ||
    msg.includes("كم السعر") ||
    msg.includes("تواصل") ||
    msg.includes("عرض")
  ) {
    return "INTERESTED";
  }

  if (
    msg.includes("عملائي") ||
    msg.includes("العملاء") ||
    msg.includes("clients") ||
    msg.includes("customers")
  ) {
    return "ASK_CUSTOMERS";
  }

  if (
    msg.includes("المنتجات") ||
    msg.includes("products") ||
    msg.includes("product") ||
    msg.includes("سعر المنتج")
  ) {
    return "ASK_PRODUCTS";
  }

  return "NORMAL";
};

module.exports = { detectIntent };
