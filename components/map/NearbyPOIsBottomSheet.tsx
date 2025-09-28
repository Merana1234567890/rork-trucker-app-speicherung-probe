import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal
} from 'react-native';
import { 
  Search, 
  Filter, 
  X, 
  MapPin, 
  Star, 
  Heart,
  AlertTriangle,
  Navigation
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { POI, POIType } from '@/types';
import { useFilteredPOIs } from '@/hooks/useFilteredPOIs';
import { POI_TYPE_LABELS, POI_TYPE_COLORS, POI_TAG_PRESETS } from '@/constants/poi';
import { COLORS } from '@/constants/colors';
import { Button } from '@/components/ui/Button';



interface NearbyPOIsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onPOISelect: (poi: POI) => void;
  onNavigateToPOI: (poi: POI) => void;
}

export function NearbyPOIsBottomSheet({
  visible,
  onClose,
  onPOISelect,
  onNavigateToPOI
}: NearbyPOIsBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [showFilters, setShowFilters] = useState(false);
  const {
    filteredPOIs,
    filter,
    updateFilter,
    clearFilter,
    toggleType,
    toggleTag,
    hasActiveFilters
  } = useFilteredPOIs();

  const renderPOIItem = (poi: POI) => {
    if (!poi?.id || !poi?.name?.trim() || poi.name.length > 100) return null;
    
    const distance = 'distance' in poi ? (poi as any).distance : null;
    const eta = 'eta' in poi ? (poi as any).eta : null;
    const typeColor = POI_TYPE_COLORS[poi.type];
    const sanitizedName = poi.name.trim();

    return (
      <TouchableOpacity
        key={poi.id}
        style={styles.poiItem}
        onPress={() => {
          if (poi?.id && poi?.name?.trim() && poi.name.length <= 100) {
            onPOISelect(poi);
          }
        }}
        testID={`poi-item-${poi.id}`}
      >
        <View style={styles.poiHeader}>
          <View style={styles.poiTitleRow}>
            <View style={[styles.typeIndicator, { backgroundColor: typeColor }]} />
            <Text style={styles.poiName} numberOfLines={1}>
              {sanitizedName}
            </Text>
            {poi.favorite && (
              <Heart size={16} color={COLORS.danger} fill={COLORS.danger} />
            )}
            {poi.flagged && (
              <AlertTriangle size={16} color={COLORS.warning} />
            )}
          </View>
          
          <View style={styles.poiMeta}>
            <Text style={styles.poiType}>
              {POI_TYPE_LABELS[poi.type]}
            </Text>
            {distance !== null && (
              <Text style={styles.poiDistance}>
                {distance} km
              </Text>
            )}
            {eta !== null && (
              <Text style={styles.poiEta}>
                ~{eta} min
              </Text>
            )}
          </View>
        </View>

        {poi.rating && (
          <View style={styles.ratingRow}>
            <Star size={14} color={COLORS.warning} fill={COLORS.warning} />
            <Text style={styles.ratingText}>{poi.rating}/5</Text>
          </View>
        )}

        {poi.tags && poi.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {poi.tags.slice(0, 3).map((tag) => (
              <View key={`${poi.id}-${tag}`} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {poi.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{poi.tags.length - 3}</Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.navigateButton}
          onPress={(e) => {
            e.stopPropagation();
            if (poi?.id && poi?.name?.trim() && poi.name.length <= 100) {
              onNavigateToPOI(poi);
            }
          }}
          testID={`navigate-${poi.id}`}
        >
          <Navigation size={16} color={COLORS.primary} />
          <Text style={styles.navigateText}>Navigation</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={[styles.filterModal, { paddingTop: insets.top }]}>
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>Filter</Text>
          <TouchableOpacity
            onPress={() => setShowFilters(false)}
            style={styles.closeButton}
            testID="close-filter"
          >
            <X size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.filterContent}>
          {/* POI Types */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>POI-Typen</Text>
            <View style={styles.typeGrid}>
              {(Object.keys(POI_TYPE_LABELS) as POIType[]).map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeChip,
                    filter.types.includes(type) && styles.typeChipActive,
                    { borderColor: POI_TYPE_COLORS[type] }
                  ]}
                  onPress={() => {
                    const sanitizedType = type?.trim();
                    if (sanitizedType && sanitizedType.length <= 50) {
                      toggleType(type);
                    }
                  }}
                  testID={`filter-type-${type}`}
                >
                  <Text style={[
                    styles.typeChipText,
                    filter.types.includes(type) && styles.typeChipTextActive
                  ]}>
                    {POI_TYPE_LABELS[type]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tags */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Tags</Text>
            <View style={styles.tagGrid}>
              {POI_TAG_PRESETS.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagChip,
                    filter.tags.includes(tag) && styles.tagChipActive
                  ]}
                  onPress={() => {
                    const sanitizedTag = tag?.trim();
                    if (sanitizedTag && sanitizedTag.length <= 50) {
                      toggleTag(tag);
                    }
                  }}
                  testID={`filter-tag-${tag}`}
                >
                  <Text style={[
                    styles.tagChipText,
                    filter.tags.includes(tag) && styles.tagChipTextActive
                  ]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Other Filters */}
          <View style={styles.filterSection}>
            <TouchableOpacity
              style={[
                styles.filterOption,
                filter.favoriteOnly && styles.filterOptionActive
              ]}
              onPress={() => updateFilter({ favoriteOnly: !filter.favoriteOnly })}
              testID="filter-favorites"
            >
              <Heart 
                size={20} 
                color={filter.favoriteOnly ? COLORS.danger : COLORS.textSecondary}
                fill={filter.favoriteOnly ? COLORS.danger : 'none'}
              />
              <Text style={[
                styles.filterOptionText,
                filter.favoriteOnly && styles.filterOptionTextActive
              ]}>
                Nur Favoriten
              </Text>
            </TouchableOpacity>
          </View>

          {/* Minimum Rating */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Mindestbewertung</Text>
            <View style={styles.ratingFilter}>
              {[1, 2, 3, 4, 5].map(rating => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingChip,
                    filter.minRating === rating && styles.ratingChipActive
                  ]}
                  onPress={() => updateFilter({ 
                    minRating: filter.minRating === rating ? null : rating 
                  })}
                  testID={`filter-rating-${rating}`}
                >
                  <Star 
                    size={16} 
                    color={filter.minRating === rating ? 'white' : COLORS.warning}
                    fill={COLORS.warning}
                  />
                  <Text style={[
                    styles.ratingChipText,
                    filter.minRating === rating && styles.ratingChipTextActive
                  ]}>
                    {rating}+
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={[styles.filterFooter, { paddingBottom: insets.bottom }]}>
          <Button
            title="Filter zurücksetzen"
            onPress={clearFilter}
            variant="outline"
            style={styles.clearButton}
            testID="clear-filters"
          />
          <Button
            title="Anwenden"
            onPress={() => setShowFilters(false)}
            style={styles.applyButton}
            testID="apply-filters"
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <Text style={styles.title}>POIs in der Nähe</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              testID="close-nearby-pois"
            >
              <X size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Search size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="POI suchen..."
                value={filter.searchQuery}
                onChangeText={(text) => updateFilter({ searchQuery: text })}
                testID="search-input"
              />
            </View>
            <TouchableOpacity
              style={[
                styles.filterButton,
                hasActiveFilters && styles.filterButtonActive
              ]}
              onPress={() => setShowFilters(true)}
              testID="open-filters"
            >
              <Filter size={20} color={hasActiveFilters ? 'white' : COLORS.primary} />
            </TouchableOpacity>
          </View>

          {hasActiveFilters && (
            <View style={styles.activeFiltersRow}>
              <Text style={styles.activeFiltersText}>
                {filteredPOIs.length} von {filteredPOIs.length} POIs
              </Text>
              <TouchableOpacity
                onPress={clearFilter}
                testID="clear-filters-quick"
              >
                <Text style={styles.clearFiltersText}>Zurücksetzen</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView 
            style={styles.poiList}
            showsVerticalScrollIndicator={false}
          >
            {filteredPOIs.length === 0 ? (
              <View style={styles.emptyState}>
                <MapPin size={48} color={COLORS.textSecondary} />
                <Text style={styles.emptyTitle}>Keine POIs gefunden</Text>
                <Text style={styles.emptyText}>
                  {hasActiveFilters 
                    ? 'Versuchen Sie andere Filtereinstellungen'
                    : 'Fügen Sie POIs hinzu, um sie hier zu sehen'
                  }
                </Text>
              </View>
            ) : (
              filteredPOIs.map(renderPOIItem).filter(Boolean)
            )}
          </ScrollView>
        </View>
      </Modal>

      {renderFilterModal()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  activeFiltersText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  clearFiltersText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  poiList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  poiItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  poiHeader: {
    marginBottom: 8,
  },
  poiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  typeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  poiName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  poiMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  poiType: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  poiDistance: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  poiEta: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: COLORS.gray100,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  moreTagsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
  },
  navigateText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  filterModal: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  filterContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: COLORS.surface,
  },
  typeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeChipText: {
    fontSize: 14,
    color: COLORS.text,
  },
  typeChipTextActive: {
    color: 'white',
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tagChipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  tagChipTextActive: {
    color: 'white',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterOptionActive: {
    backgroundColor: COLORS.gray100,
    borderColor: COLORS.primary,
  },
  filterOptionText: {
    fontSize: 16,
    color: COLORS.text,
  },
  filterOptionTextActive: {
    fontWeight: '500',
  },
  ratingFilter: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ratingChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  ratingChipText: {
    fontSize: 14,
    color: COLORS.text,
  },
  ratingChipTextActive: {
    color: 'white',
  },
  filterFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  clearButton: {
    flex: 1,
  },
  applyButton: {
    flex: 1,
  },
});