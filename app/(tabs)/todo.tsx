import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobal } from '../lib/context/GlobalContext';

export default function TodoScreen() {
  const insets = useSafeAreaInsets();
  const { userData, addTodo, toggleTodo, uncheckAllTodos } = useGlobal();
  const [newTodoText, setNewTodoText] = useState('');

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      addTodo(newTodoText.trim());
      setNewTodoText('');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Daily Wellness Tasks</Text>
      <Text style={styles.subtitle}>Track your self-care activities</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a new task..."
          placeholderTextColor="#666"
          value={newTodoText}
          onChangeText={setNewTodoText}
          onSubmitEditing={handleAddTodo}
        />
        <Pressable style={styles.addButton} onPress={handleAddTodo}>
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.todoList}>
        {userData?.todos.map((todo) => (
          <Pressable
            key={todo.id}
            style={styles.todoItem}
            onPress={() => toggleTodo(todo.id)}
          >
            <View
              style={[styles.checkbox, todo.completed && styles.checkedBox]}
            />
            <Text
              style={[
                styles.todoText,
                todo.completed && styles.completedTodoText,
              ]}
            >
              {todo.text}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable style={styles.resetButton} onPress={uncheckAllTodos}>
        <Text style={styles.resetButtonText}>Reset All Tasks</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  todoList: {
    flex: 1,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 12,
  },
  checkedBox: {
    backgroundColor: '#007AFF',
  },
  todoText: {
    color: '#ffffff',
    fontSize: 16,
    flex: 1,
  },
  completedTodoText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  resetButton: {
    backgroundColor: '#ff3b30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
