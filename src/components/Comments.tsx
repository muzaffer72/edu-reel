import React, { useMemo, useState } from 'react';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, CheckCircle, CornerDownRight, X } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';

interface CommentsProps {
  postId: string;
  postOwnerId?: string;
}

export const Comments: React.FC<CommentsProps> = ({ postId, postOwnerId }) => {
  const { user } = useAuth();
  const { comments, loading, addComment, toggleProposed, acceptAsCorrect, acceptedCommentId } = useComments(postId);
  const { uploadFile, uploading } = useFileUpload();

  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isPostOwner = user?.id && postOwnerId && user.id === postOwnerId;

  const grouped = useMemo(() => {
    const top = comments.filter(c => !c.parent_id);
    const byParent: Record<string, typeof comments> = {};
    comments.forEach(c => {
      if (c.parent_id) {
        byParent[c.parent_id] = byParent[c.parent_id] || [];
        byParent[c.parent_id].push(c);
      }
    });
    return { top, byParent };
  }, [comments]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
    e.currentTarget.value = '';
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    let url: string | null = null;
    if (selectedImage) {
      url = await uploadFile(selectedImage, 'attachments');
    }
    const ok = await addComment(content.trim(), url, replyTo);
    if (ok) {
      setContent('');
      setReplyTo(null);
      setSelectedImage(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const CommentRow: React.FC<{ id: string } & React.HTMLAttributes<HTMLDivElement>> = ({ id }) => {
    const c = comments.find(x => x.id === id);
    if (!c) return null;
    const initials = (c.profiles?.display_name || 'U').split(' ').map(s => s[0]).join('').toUpperCase();
    const isAuthor = user?.id === c.user_id;
    const replies = grouped.byParent[id] || [];

    return (
      <div className="space-y-2">
        <div className="flex items-start space-x-3">
          <Avatar className="h-8 w-8">
            {c.profiles?.avatar_url ? (
              <AvatarImage src={c.profiles.avatar_url} alt="Kullanıcı" />
            ) : (
              <AvatarFallback>{initials}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{c.profiles?.display_name || 'Kullanıcı'}</span>
              {acceptedCommentId === c.id && (
                <span className="inline-flex items-center gap-1 text-xs text-secondary">
                  <CheckCircle className="w-3 h-3" /> Doğru Cevap
                </span>
              )}
              {c.proposed_as_correct && acceptedCommentId !== c.id && (
                <span className="text-[11px] text-muted-foreground">(Önerildi)</span>
              )}
            </div>
            <div className="text-sm text-foreground whitespace-pre-wrap">{c.content}</div>
            {c.attachment_url && (
              <img src={c.attachment_url} alt="Yorum görseli" className="mt-2 rounded-md max-h-64 object-cover" />
            )}
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <button className="hover:text-primary" onClick={() => setReplyTo(c.id)}>Yanıtla</button>
              {isAuthor && (
                <button className="hover:text-secondary" onClick={() => toggleProposed(c.id, !c.proposed_as_correct)}>
                  {c.proposed_as_correct ? 'Öneriyi Kaldır' : 'Doğru Cevap Olarak Öner'}
                </button>
              )}
              {isPostOwner && (
                acceptedCommentId === c.id ? (
                  <button className="hover:text-destructive" onClick={() => acceptAsCorrect(null)}>
                    Kabulü Kaldır
                  </button>
                ) : (
                  <button className="hover:text-secondary" onClick={() => acceptAsCorrect(c.id)}>
                    Doğru Cevap Olarak İşaretle
                  </button>
                )
              )}
            </div>
          </div>
        </div>
        {replies.length > 0 && (
          <div className="pl-6 border-l border-border ml-4 space-y-3">
            {replies.map(r => (
              <div key={r.id} className="flex items-start space-x-3">
                <CornerDownRight className="w-4 h-4 mt-2 text-muted-foreground" />
                <Avatar className="h-7 w-7">
                  {r.profiles?.avatar_url ? (
                    <AvatarImage src={r.profiles.avatar_url} alt="Kullanıcı" />
                  ) : (
                    <AvatarFallback>{initials}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <div className="text-sm text-foreground whitespace-pre-wrap">{r.content}</div>
                  {r.attachment_url && (
                    <img src={r.attachment_url} alt="Yorum görseli" className="mt-2 rounded-md max-h-64 object-cover" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-border p-4 bg-card/50">
      <div className="text-sm font-medium mb-3">Yorumlar</div>
      {loading ? (
        <div className="text-sm text-muted-foreground">Yükleniyor...</div>
      ) : comments.length === 0 ? (
        <div className="text-sm text-muted-foreground">İlk yorumu sen yaz!</div>
      ) : (
        <div className="space-y-4">
          {grouped.top.map(c => (
            <CommentRow key={c.id} id={c.id} />
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="mt-4 space-y-2">
        {replyTo && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <CornerDownRight className="w-3 h-3" />
            Yanıtla modunda
            <button className="text-foreground inline-flex items-center gap-1" onClick={() => setReplyTo(null)}>
              <X className="w-3 h-3" /> Kapat
            </button>
          </div>
        )}
        <Textarea
          placeholder="Yorum yaz..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[80px] resize-none"
        />
        {previewUrl && (
          <div className="relative">
            <img src={previewUrl} alt="Önizleme" className="max-h-48 rounded-md" />
            <button
              className="absolute top-2 right-2 bg-background/80 rounded-full p-1"
              onClick={() => { setSelectedImage(null); if (previewUrl) { URL.revokeObjectURL(previewUrl); } setPreviewUrl(null); }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <label className="cursor-pointer inline-flex items-center gap-2 text-sm text-muted-foreground">
            <ImageIcon className="w-4 h-4" />
            Görsel Ekle
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
          <Button onClick={handleSubmit} disabled={!content.trim() || uploading}>
            Gönder
          </Button>
        </div>
      </div>
    </div>
  );
};
