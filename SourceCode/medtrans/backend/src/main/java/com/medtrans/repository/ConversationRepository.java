package com.medtrans.repository;

import com.medtrans.entity.Conversation;
import com.medtrans.entity.ConversationType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
  List<Conversation> findByUserIdOrderByCreatedAtDesc(Long userId);
  List<Conversation> findByUserIdAndTypeOrderByCreatedAtDesc(Long userId, ConversationType type);
}
