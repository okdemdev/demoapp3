import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Post } from '../lib/context/GlobalContext';
import { MetricKey, useGlobal } from '../lib/context/GlobalContext';

// Types
type Comment = {
  id: string;
  author: string;
  content: string;
  timestamp: string;
};

type Win = {
  id: string;
  username: string;
  metric: MetricKey;
  beforeValue: number;
  afterValue: number;
  content: string;
  days: number;
  thoughts: Thought[];
};

type Thought = {
  id: string;
  taskTitle: string;
  content: string;
  date: string;
};

// Mock data for wins section
const mockWins: Win[] = [
  {
    id: '1',
    username: 'David',
    metric: 'wisdom',
    beforeValue: 25,
    afterValue: 48,
    content: 'Went from reading 0 pages a week to over 100 pages and significantly improved wisdom!',
    days: 14,
    thoughts: [
      {
        id: '1',
        taskTitle: 'Read for 20 minutes',
        content: 'The hardest part was finding a quiet space without distractions. Once I created a reading corner in my home, it became much easier.',
        date: '3 days ago'
      },
      {
        id: '2',
        taskTitle: 'Finish one book chapter',
        content: 'I struggled with staying focused initially. The Pomodoro technique really helped me stay on track.',
        date: '5 days ago'
      },
      {
        id: '3',
        taskTitle: 'Watch educational video',
        content: 'Finding quality content was challenging. I now keep a list of recommended educational channels.',
        date: '1 week ago'
      }
    ]
  },
  {
    id: '2',
    username: 'Sarah',
    metric: 'strength',
    beforeValue: 18,
    afterValue: 42,
    content: 'Transformed from 0 workouts weekly to a consistent 5-day routine and doubled strength metrics!',
    days: 30,
    thoughts: [
      {
        id: '1',
        taskTitle: 'Do 20 push-ups',
        content: 'Starting with modified push-ups made this achievable. Progress was slow but consistent.',
        date: '2 days ago'
      },
      {
        id: '2',
        taskTitle: '30-minute strength training',
        content: 'Finding motivation was my biggest challenge. Setting specific times for workouts helped me stay accountable.',
        date: '1 week ago'
      }
    ]
  },
  {
    id: '3',
    username: 'Michael',
    metric: 'focus',
    beforeValue: 30,
    afterValue: 67,
    content: 'Went from constant distractions to 2-hour focused work sessions and tripled productivity!',
    days: 21,
    thoughts: [
      {
        id: '1',
        taskTitle: 'Meditate for 10 minutes',
        content: 'Initially my mind would wander constantly. Using guided meditations helped me stay focused.',
        date: '4 days ago'
      },
      {
        id: '2',
        taskTitle: 'Complete 1 Pomodoro session',
        content: 'Turning off notifications was key to my success. I still struggle with not checking my phone.',
        date: '1 week ago'
      }
    ]
  },
  {
    id: '4',
    username: 'Emma',
    metric: 'discipline',
    beforeValue: 22,
    afterValue: 58,
    content: 'Transformed from chaotic schedule to consistent daily routines and saw massive improvement in discipline!',
    days: 40,
    thoughts: [
      {
        id: '1',
        taskTitle: 'Wake up at 6AM',
        content: 'The hardest part was going to bed early. I still struggle with this sometimes but having a bedtime routine helps.',
        date: '3 days ago'
      },
      {
        id: '2',
        taskTitle: 'Follow daily planner',
        content: "I found it helpful to plan the night before. When I wait until morning, I'm less likely to stick to the plan.",
        date: '1 week ago'
      }
    ]
  }
];

// Win Component
const WinCard = ({
  win,
  onViewThoughts,
  onViewProgress
}: {
  win: Win;
  onViewThoughts: (win: Win) => void;
  onViewProgress: (win: Win) => void;
}) => {
  return (
    <View style={styles.winCard}>
      <View style={styles.winHeader}>
        <View style={styles.winIconContainer}>
          <Ionicons name={getMetricIcon(win.metric)} size={24} color="#fff" />
        </View>
        <View style={styles.winHeaderText}>
          <Text style={styles.winUsername}>{win.username}'s Win</Text>
          <Text style={styles.winMetric}>
            {win.metric.charAt(0).toUpperCase() + win.metric.slice(1)} • {win.days} days
          </Text>
        </View>
      </View>

      <Text style={styles.winDescription}>{win.content}</Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressStart}>
          <Text style={styles.progressValue}>{win.beforeValue}</Text>
          <Text style={styles.progressLabel}>Start</Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBar, { width: `${(win.afterValue / 100) * 100}%` }]} />
          </View>
          <View style={styles.progressArrow}>
            <Ionicons name="arrow-forward" size={16} color="#F37335" />
          </View>
        </View>

        <View style={styles.progressEnd}>
          <Text style={styles.progressValue}>{win.afterValue}</Text>
          <Text style={styles.progressLabel}>Now</Text>
        </View>
      </View>

      <View style={styles.winButtons}>
        <TouchableOpacity
          style={styles.winButton}
          onPress={() => onViewThoughts(win)}>
          <Text style={styles.winButtonText}>Check Thoughts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.winButton}
          onPress={() => onViewProgress(win)}>
          <Text style={styles.winButtonText}>See Progress</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Get icon for metric
const getMetricIcon = (metric: MetricKey): any => {
  const icons: Record<MetricKey, string> = {
    wisdom: 'book-outline',
    strength: 'barbell-outline',
    focus: 'eye-outline',
    confidence: 'sunny-outline',
    discipline: 'time-outline'
  };
  return icons[metric];
};

// Modify the ThoughtsModal to ensure content is visible
const ThoughtsModal = ({ isVisible, win, onClose }: { isVisible: boolean, win: Win | null, onClose: () => void }) => {
  if (!win) return null;

  console.log("Rendering thoughts modal for", win.username);
  console.log("Available thoughts:", win.thoughts.length);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{win.username}'s Thoughts</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <ScrollView>
              <Text style={styles.modalSubtitle}>
                Reflections on improving {win.metric} over {win.days} days
              </Text>

              {win.thoughts.map(thought => (
                <View key={thought.id} style={styles.thoughtCard}>
                  <View style={styles.thoughtHeader}>
                    <View style={styles.thoughtIconContainer}>
                      <Ionicons name={getMetricIcon(win.metric)} size={18} color="#fff" />
                    </View>
                    <Text style={styles.thoughtTitle}>{thought.taskTitle}</Text>
                  </View>
                  <Text style={styles.thoughtContent}>"{thought.content}"</Text>
                  <Text style={styles.thoughtDate}>{thought.date}</Text>
                </View>
              ))}

              {/* Add this extra text for debugging */}
              <Text style={{ color: '#fff', padding: 20, fontSize: 14 }}>
                Showing {win.thoughts.length} thoughts
              </Text>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Modify the ProgressModal for better visibility
const ProgressModal = ({ isVisible, win, onClose }: { isVisible: boolean, win: Win | null, onClose: () => void }) => {
  if (!win) return null;

  console.log("Rendering progress modal for", win.username);
  console.log("Before value:", win.beforeValue, "After value:", win.afterValue);

  const improvement = win.afterValue - win.beforeValue;
  const percentImprovement = Math.round((improvement / win.beforeValue) * 100);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{win.username}'s Progress</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <ScrollView>
              <Text style={styles.modalSubtitle}>
                {win.days}-day improvement in {win.metric}
              </Text>

              {/* Overall improvement card - similar to potential-ratings */}
              <View style={[styles.potentialCard, { backgroundColor: '#F37335' }]}>
                <View style={styles.potentialHeader}>
                  <Ionicons name="star" size={24} color="#fff" />
                  <Text style={styles.potentialLabel}>{win.metric.charAt(0).toUpperCase() + win.metric.slice(1)}</Text>
                </View>
                <View style={styles.potentialValueContainer}>
                  <Text style={styles.potentialValue}>{win.afterValue}</Text>
                  <Text style={styles.potentialImprovement}>(+{improvement})</Text>
                </View>
                <View style={styles.potentialBarContainer}>
                  <View
                    style={[
                      styles.potentialBar,
                      { width: `${Math.min(100, win.afterValue)}%` }
                    ]}
                  />
                </View>
              </View>

              <Text style={styles.beforeAfterTitle}>Before & After</Text>

              {/* Before & After cards in grid */}
              <View style={styles.beforeAfterGrid}>
                {/* Before Card */}
                <View style={styles.comparisonCard}>
                  <Text style={styles.comparisonHeader}>Before</Text>
                  <Text style={styles.comparisonValue}>{win.beforeValue}</Text>
                  <View style={styles.comparisonBarContainer}>
                    <View
                      style={[
                        styles.comparisonBar,
                        { width: `${Math.min(100, win.beforeValue)}%` }
                      ]}
                    />
                  </View>
                </View>

                {/* After Card */}
                <View style={styles.comparisonCard}>
                  <Text style={styles.comparisonHeader}>After</Text>
                  <Text style={styles.comparisonValue}>{win.afterValue}</Text>
                  <View style={styles.comparisonBarContainer}>
                    <View
                      style={[
                        styles.comparisonBar,
                        { width: `${Math.min(100, win.afterValue)}%` }
                      ]}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.improvementSummary}>
                <Text style={styles.improvementTitle}>Total Improvement</Text>
                <Text style={styles.improvementPoints}>+{improvement} points</Text>
                <Text style={styles.improvementPercent}>{percentImprovement}% increase</Text>
              </View>

              <View style={styles.howTheyDidIt}>
                <Text style={styles.howTheyDidItTitle}>How They Did It</Text>
                <Text style={styles.howTheyDidItContent}>
                  {win.username} consistently completed daily tasks focused on improving their {win.metric} over {win.days} days. Steady progress and dedication to the process were key to their success.
                </Text>
              </View>

              {/* Add this extra text for debugging */}
              <Text style={{ color: '#fff', padding: 20, fontSize: 14 }}>
                Improvement: {improvement} points ({percentImprovement}%)
              </Text>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const { userData, addPost, addComment } = useGlobal();
  const [activeThread, setActiveThread] = useState<'events' | 'friends' | 'wins'>('events');
  const [newPost, setNewPost] = useState('');
  const [newComment, setNewComment] = useState('');
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [commentingOnPost, setCommentingOnPost] = useState<string | null>(null);

  // For displaying win details
  const [selectedWin, setSelectedWin] = useState<Win | null>(null);
  const [showThoughtsModal, setShowThoughtsModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);

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

  const viewWinThoughts = (win: Win) => {
    console.log('Opening thoughts modal for:', win.username);
    setSelectedWin(win);
    setShowThoughtsModal(true);
  };

  const viewWinProgress = (win: Win) => {
    console.log('Opening progress modal for:', win.username);
    setSelectedWin(win);
    setShowProgressModal(true);
  };

  const renderPost = (post: Post) => {
    const isExpanded = expandedPosts.has(post.id);
    const isCommenting = commentingOnPost === post.id;

    return (
      <View key={post.id} style={styles.card}>
        <View style={styles.postHeader}>
          <Text style={styles.authorText}>{post.author}</Text>
          <Text style={styles.timestampText}>{post.timestamp}</Text>
        </View>
        <Text style={styles.postContent}>{post.content}</Text>

        {post.comments.length > 0 && (
          <TouchableOpacity
            style={styles.commentsButton}
            onPress={() => togglePostComments(post.id)}
          >
            <Text style={styles.commentsButtonText}>
              {isExpanded
                ? 'Hide Comments'
                : `Comments (${post.comments.length})`}
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#F37335"
              style={styles.commentIcon}
            />
          </TouchableOpacity>
        )}

        {isExpanded && (
          <View style={styles.comments}>
            {post.comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
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
        <Text style={styles.headerTitle}>Community</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeThread === 'events' && styles.activeTab]}
            onPress={() => setActiveThread('events')}
          >
            <Text
              style={[
                styles.tabText,
                activeThread === 'events' && styles.activeTabText,
              ]}
            >
              Events
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeThread === 'friends' && styles.activeTab]}
            onPress={() => setActiveThread('friends')}
          >
            <Text
              style={[
                styles.tabText,
                activeThread === 'friends' && styles.activeTabText,
              ]}
            >
              Friends
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeThread === 'wins' && styles.activeTab]}
            onPress={() => setActiveThread('wins')}
          >
            <Text
              style={[
                styles.tabText,
                activeThread === 'wins' && styles.activeTabText,
              ]}
            >
              Wins
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {activeThread === 'events' &&
          userData?.community.eventPosts.map((post) => renderPost(post))}

        {activeThread === 'friends' &&
          userData?.community.friendsPosts.map((post) => renderPost(post))}

        {activeThread === 'wins' &&
          mockWins.map((win) => (
            <WinCard
              key={win.id}
              win={win}
              onViewThoughts={viewWinThoughts}
              onViewProgress={viewWinProgress}
            />
          ))}
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

      {/* Use the new modal components */}
      <ThoughtsModal
        isVisible={showThoughtsModal}
        win={selectedWin}
        onClose={() => setShowThoughtsModal(false)}
      />

      <ProgressModal
        isVisible={showProgressModal}
        win={selectedWin}
        onClose={() => setShowProgressModal(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#222',
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#F37335',
  },
  tabText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#222',
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  authorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  timestampText: {
    fontSize: 14,
    color: '#999',
  },
  postContent: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  commentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  commentsButtonText: {
    color: '#F37335',
    fontSize: 14,
    marginRight: 4,
  },
  commentIcon: {
    marginTop: 2,
  },
  comments: {
    marginTop: 12,
  },
  commentItem: {
    backgroundColor: '#333',
    borderRadius: 10,
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
    color: '#999',
  },
  commentContent: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 18,
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#111',
  },
  input: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    minHeight: 40,
  },
  postButton: {
    backgroundColor: '#F37335',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#444',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  commentInputContainer: {
    marginTop: 12,
    backgroundColor: '#444',
    borderRadius: 10,
    padding: 12,
  },
  commentInput: {
    color: '#fff',
    fontSize: 14,
    minHeight: 36,
  },
  commentButton: {
    backgroundColor: '#F37335',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  commentButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Win Card Styles
  winCard: {
    backgroundColor: '#222',
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
  },
  winHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  winIconContainer: {
    backgroundColor: '#F37335',
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
  },
  winHeaderText: {
    flex: 1,
  },
  winUsername: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  winMetric: {
    fontSize: 14,
    color: '#999',
  },
  winDescription: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressStart: {
    alignItems: 'center',
    width: 40,
  },
  progressEnd: {
    alignItems: 'center',
    width: 40,
  },
  progressValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressLabel: {
    fontSize: 12,
    color: '#999',
  },
  progressBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F37335',
    borderRadius: 3,
  },
  progressArrow: {
    marginLeft: 5,
  },
  winButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  winButton: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.48,
  },
  winButtonText: {
    color: '#F37335',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Updated modal styles for better visibility
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#222',
    borderRadius: 15,
    width: '90%',
    height: '80%',
    padding: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },

  // Potential rating style modal (like in potential-ratings.tsx)
  potentialCard: {
    backgroundColor: '#F37335',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  potentialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  potentialLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  potentialValueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  potentialValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
  },
  potentialImprovement: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 4,
    marginBottom: 8,
  },
  potentialBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  potentialBar: {
    height: '100%',
    backgroundColor: '#fff',
  },

  // Before/After comparison styles
  beforeAfterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 12,
  },
  beforeAfterGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  comparisonCard: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 16,
    width: '48%',
  },
  comparisonHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  comparisonValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  comparisonBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  comparisonBar: {
    height: '100%',
    backgroundColor: '#F37335',
  },

  // Improvement summary styles
  improvementSummary: {
    backgroundColor: '#F37335',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  improvementTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  improvementPoints: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  improvementPercent: {
    fontSize: 16,
    color: '#fff',
  },

  // How they did it section
  howTheyDidIt: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  howTheyDidItTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  howTheyDidItContent: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  // Thought Card Styles
  thoughtCard: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  thoughtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  thoughtIconContainer: {
    backgroundColor: '#F37335',
    borderRadius: 8,
    padding: 6,
    marginRight: 10,
  },
  thoughtTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  thoughtContent: {
    fontSize: 15,
    color: '#fff',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 8,
  },
  thoughtDate: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'flex-end',
  },
});
