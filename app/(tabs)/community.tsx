import { FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Post } from '../lib/context/GlobalContext';
import { useGlobal } from '../lib/context/GlobalContext';

// Types
type Comment = {
  id: string;
  author: string;
  content: string;
  timestamp: string;
};

// Sample data
const eventPosts: Post[] = [
  {
    id: '1',
    author: 'Community Team',
    content:
      '🏃‍♂️ Join our Virtual 5K Challenge! Track your progress and compete with others in our community. Starting next week!',
    timestamp: '2h ago',
    comments: [
      {
        id: '1',
        author: 'Sarah',
        content:
          'Count me in! Been looking for motivation to start running again.',
        timestamp: '1h ago',
      },
      {
        id: '2',
        author: 'Mike',
        content: 'Is there a specific app we should use to track our runs?',
        timestamp: '30m ago',
      },
    ],
  },
  {
    id: '2',
    author: 'Community Team',
    content:
      '🧘‍♀️ Weekly Meditation Session - Join us every Monday at 8 AM EST for a guided meditation session to start your week with clarity and focus.',
    timestamp: '1d ago',
    comments: [
      {
        id: '3',
        author: 'Emma',
        content: 'These sessions have been life-changing! Highly recommend.',
        timestamp: '20h ago',
      },
    ],
  },
  {
    id: '3',
    author: 'Community Team',
    content:
      '💪 30-Day Habit Building Challenge - Start small, stay consistent. Join us in building one positive habit over the next month.',
    timestamp: '2d ago',
    comments: [
      {
        id: '4',
        author: 'Alex',
        content: `Perfect timing! I've been wanting to establish a morning routine.`,
        timestamp: '1d ago',
      },
    ],
  },
];

const friendPosts: Post[] = [
  {
    id: '1',
    author: 'John',
    content: 'Just completed my first week of daily meditation! 🧘‍♂️',
    timestamp: '1h ago',
    comments: [
      {
        id: '1',
        author: 'Lisa',
        content: `That's awesome! How are you feeling?`,
        timestamp: '30m ago',
      },
    ],
  },
  {
    id: '2',
    author: 'Emma',
    content: 'Hit a new personal record in my workout today! 💪',
    timestamp: '3h ago',
    comments: [],
  },
];

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const { userData, addPost, addComment } = useGlobal();
  const [activeThread, setActiveThread] = useState<'events' | 'friends'>(
    'events'
  );
  const [newPost, setNewPost] = useState('');
  const [newComment, setNewComment] = useState('');
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [commentingOnPost, setCommentingOnPost] = useState<string | null>(null);

  const togglePostComments = (postId: string) => {
    setExpandedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
        setCommentingOnPost(null);
      } else {
        newSet.add(postId);
        if (activeThread === 'friends') {
          setCommentingOnPost(postId);
        }
      }
      return newSet;
    });
  };

  const handlePost = async () => {
    if (newPost.trim()) {
      await addPost(newPost);
      setNewPost('');
    }
  };

  const handleComment = async (postId: string) => {
    if (newComment.trim()) {
      await addComment(postId, newComment);
      setNewComment('');
      setCommentingOnPost(null);
    }
  };

  const renderPost = (post: Post) => {
    const isExpanded = expandedPosts.has(post.id);
    const isCommenting = commentingOnPost === post.id;

    return (
      <View key={post.id} style={styles.post}>
        <View style={styles.postHeader}>
          <Text style={styles.author}>{post.author}</Text>
          <Text style={styles.timestamp}>{post.timestamp}</Text>
        </View>
        <Text style={styles.postContent}>{post.content}</Text>

        {activeThread === 'friends' && (
          <TouchableOpacity
            style={styles.commentsButton}
            onPress={() => togglePostComments(post.id)}
          >
            <Text style={styles.commentsButtonText}>
              {isExpanded
                ? 'Hide Comments'
                : `Comments (${post.comments.length})`}
            </Text>
            <FontAwesome
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color="#007AFF"
              style={styles.commentIcon}
            />
          </TouchableOpacity>
        )}

        {activeThread === 'events' && post.comments.length > 0 && (
          <TouchableOpacity
            style={styles.commentsButton}
            onPress={() => togglePostComments(post.id)}
          >
            <Text style={styles.commentsButtonText}>
              {isExpanded
                ? 'Hide Comments'
                : `Show Comments (${post.comments.length})`}
            </Text>
            <FontAwesome
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color="#007AFF"
              style={styles.commentIcon}
            />
          </TouchableOpacity>
        )}

        {isExpanded && (
          <View style={styles.comments}>
            {post.comments.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>{comment.author}</Text>
                  <Text style={styles.commentTimestamp}>
                    {comment.timestamp}
                  </Text>
                </View>
                <Text style={styles.commentContent}>{comment.content}</Text>
              </View>
            ))}

            {activeThread === 'friends' && isCommenting && (
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Write a comment..."
                  placeholderTextColor="#666"
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                />
                <TouchableOpacity
                  style={[
                    styles.commentButton,
                    !newComment.trim() && styles.disabledButton,
                  ]}
                  onPress={() => handleComment(post.id)}
                  disabled={!newComment.trim()}
                >
                  <Text style={styles.commentButtonText}>Comment</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <View style={styles.threadButtons}>
          <TouchableOpacity
            style={[
              styles.threadButton,
              activeThread === 'events' && styles.activeThreadButton,
            ]}
            onPress={() => setActiveThread('events')}
          >
            <Text
              style={[
                styles.threadButtonText,
                activeThread === 'events' && styles.activeThreadButtonText,
              ]}
            >
              Events
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.threadButton,
              activeThread === 'friends' && styles.activeThreadButton,
            ]}
            onPress={() => setActiveThread('friends')}
          >
            <Text
              style={[
                styles.threadButtonText,
                activeThread === 'friends' && styles.activeThreadButtonText,
              ]}
            >
              My Friends
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {activeThread === 'events'
          ? userData?.community.eventPosts.map((post) => renderPost(post))
          : userData?.community.friendsPosts.map((post) => renderPost(post))}
      </ScrollView>

      {activeThread === 'friends' && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Share something with your friends..."
            placeholderTextColor="#666"
            value={newPost}
            onChangeText={setNewPost}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.postButton,
              !newPost.trim() && styles.disabledButton,
            ]}
            onPress={handlePost}
            disabled={!newPost.trim()}
          >
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  threadButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  threadButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  activeThreadButton: {
    backgroundColor: '#007AFF',
  },
  threadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  activeThreadButtonText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  post: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  author: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
  },
  postContent: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
  },
  commentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  commentsButtonText: {
    color: '#007AFF',
    fontSize: 14,
    marginRight: 4,
  },
  commentIcon: {
    marginTop: 2,
  },
  comments: {
    marginTop: 12,
  },
  comment: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  commentTimestamp: {
    fontSize: 12,
    color: '#666',
  },
  commentContent: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#2a2a2a',
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    minHeight: 40,
    maxHeight: 100,
  },
  postButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#333',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  commentInputContainer: {
    marginTop: 12,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
  },
  commentInput: {
    color: '#fff',
    fontSize: 14,
    minHeight: 36,
    maxHeight: 80,
  },
  commentButton: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  commentButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
