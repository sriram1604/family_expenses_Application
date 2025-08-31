import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Platform,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";

export default function ExpenseCard({
  monthKey,
  data,
  isOpen,
  onToggle,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}) {
  const [input, setInput] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [editText, setEditText] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Keyboard listeners to get the keyboard height
  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardWillShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener("keyboardWillHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const totals = useMemo(() => {
    const total = (data.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
    const balance = (data.income || 0) - total;
    return { total, balance };
  }, [data]);

  const addHandler = () => {
    if (!input.trim()) return;
    onAddExpense(input);
    setInput("");
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setEditText(`${item.name} - ${item.amount}`);
  };

  const saveEdit = () => {
    if (!editText.trim()) return;
    onEditExpense(editingItem.id, editText);
    setEditingItem(null);
    setEditText("");
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.monthText}>🗓 {monthKey}</Text>
          <Text style={styles.smallText}>மொத்த வருமானம்: ₹{data.income ?? 0}</Text>
          <Text style={styles.smallText}>மொத்த செலவுகள்: ₹{totals.total}</Text>
          <Text style={styles.balance}>மீதமுள்ள தொகை: ₹{totals.balance}</Text>
        </View>
        <TouchableOpacity onPress={() => onToggle(monthKey)} style={styles.iconButton}>
          <Ionicons name={isOpen ? "remove" : "add"} size={24} color="#111" />
        </TouchableOpacity>
      </View>

      {/* Expanded content */}
      {isOpen && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: keyboardHeight + 10 }}
        >
          {/* Expenses List */}
          {data.expenses && data.expenses.length > 0 ? (
            data.expenses.map((item) => (
              <View key={item.id} style={styles.expenseItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.expenseName}>{item.name}</Text>
                  <Text style={styles.expenseAmount}>₹{item.amount}</Text>
                  <Text style={styles.expenseDate}>
                    {dayjs(item.date).format("DD/MM/YYYY HH:mm")}
                  </Text>
                </View>
                <View style={styles.buttonsRow}>
                  <TouchableOpacity style={styles.editButton} onPress={() => startEdit(item)}>
                    <Text style={styles.buttonText}>திருத்து</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => onDeleteExpense(item.id)}
                  >
                    <Text style={styles.buttonText}>நீக்கு</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>இன்னும் செலவுகள் இல்லை.</Text>
          )}

          {/* Input and Add Button */}
          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="உதா: காய்கறி - 200 அல்லது பால்800"
              style={styles.input}
              placeholderTextColor="#555"
            />
            <TouchableOpacity onPress={addHandler} style={styles.addButton}>
              <Text style={styles.addButtonText}>சேர்</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Android Edit Modal */}
      {editingItem && (
        <Modal transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>செலவு திருத்தம்</Text>
              <TextInput
                style={styles.modalInput}
                value={editText}
                onChangeText={setEditText}
                placeholder="உதா: காய்கறி - 200"
              />
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity style={styles.modalButton} onPress={() => setEditingItem(null)}>
                  <Text style={styles.modalButtonText}>ரத்து</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButton} onPress={saveEdit}>
                  <Text style={styles.modalButtonText}>சேமி</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  monthText: { fontSize: 20, fontWeight: "bold", color: "#111" },
  smallText: { fontSize: 16, fontWeight: "600", color: "gray", marginTop: 4 },
  balance: { marginTop: 6, fontSize: 18, fontWeight: "bold", color: "green" },
  iconButton: { padding: 8, borderRadius: 25, borderWidth: 1, borderColor: "#ccc" },
  expenseItem: {
    flexDirection: "row",
    backgroundColor: "#e6f0ff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    alignItems: "center",
  },
  expenseName: { fontWeight: "bold", fontSize: 16, color: "#111" },
  expenseAmount: { color: "red", fontWeight: "bold", fontSize: 16, marginTop: 2 },
  expenseDate: { fontSize: 12, color: "gray", marginTop: 2 },
  buttonsRow: { flexDirection: "row", marginLeft: 8 },
  editButton: { backgroundColor: "#FFD700", paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, marginRight: 4 },
  deleteButton: { backgroundColor: "#FF4500", paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 14 },
  empty: { color: "gray", fontStyle: "italic", textAlign: "center", marginTop: 20 },
  inputRow: { flexDirection: "row", marginTop: 12, alignItems: "center" },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 12, paddingHorizontal: 12, height: 48, fontSize: 16, fontWeight: "600" },
  addButton: { backgroundColor: "#007AFF", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  addButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalContainer: { width: "85%", backgroundColor: "white", borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  modalInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 12, paddingHorizontal: 12, height: 48, fontSize: 16, fontWeight: "600", marginBottom: 16 },
  modalButtonsRow: { flexDirection: "row", justifyContent: "flex-end" },
  modalButton: { marginLeft: 12 },
  modalButtonText: { fontSize: 16, fontWeight: "bold", color: "#007AFF" },
});