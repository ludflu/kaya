import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LuMap,
  LuZap,
  LuSquare,
  LuTrash2,
  LuInfo,
  LuLayers,
  LuLoader,
  LuBrain,
  LuPlay,
} from 'react-icons/lu';
import { useGameTree } from '../../contexts/GameTreeContext';
import { useAIEngine } from '../../contexts/AIEngineContext';
import { AnalysisLegendModal } from './AnalysisLegendModal';
import {
  createInitialAnalysisState,
  updateAnalysisState,
  generateAnalysisCacheKey,
  smoothAnalysisResult,
} from '../../utils/aiAnalysis';
import { getPathToNode } from '../../utils/gameCache';
import { AnalysisChart, type AnalysisDataPoint } from './AnalysisChart';
import { useAIAnalysis } from '../ai/AIAnalysisOverlay';
import { parseGTPCoordinate } from '../../utils/gtpUtils';
import './AnalysisGraphPanel.css';

export interface AnalysisGraphPanelProps {
  className?: string;
}

/**
 * Panel displaying win rate and score lead graphs for AI analysis results.
 * Shows graphs when there are AI analysis results for positions on the current branch.
 */
export const AnalysisGraphPanel: React.FC<AnalysisGraphPanelProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const {
    gameTree,
    currentNodeId,
    rootId,
    gameInfo,
    analysisCache,
    analysisCacheSize,
    navigate,
    navigateToMove,
    analysisMode,
    toggleAnalysisMode,
    addMoveSequence,
  } = useGameTree();

  const {
    analyzeFullGame,
    stopFullGameAnalysis,
    isFullGameAnalyzing,
    isStopping,
    fullGameProgress,
    isInitializing,
    pendingFullGameAnalysis,
    toggleOwnership,
    showOwnership,
    clearAnalysisCache,
    showTopMoves,
    toggleTopMoves,
    isAnalyzing,
  } = useAIAnalysis();

  // Toggle state for showing/hiding each metric
  const [showWinRate, setShowWinRate] = useState(true);
  const [showScoreLead, setShowScoreLead] = useState(true);
  const [showMoveStrengthInfo, setShowMoveStrengthInfo] = useState(false);
  const [showMoveLossTable, setShowMoveLossTable] = useState(false);

  // AI Engine for generating alternate playouts
  const { engine: aiEngine, isEngineReady } = useAIEngine();

  // State for alternate playouts
  const [alternatePlayouts, setAlternatePlayouts] = useState<
    Map<number | string, { moves: string[]; isGenerating: boolean }>
  >(new Map());
  const [expandedPlayouts, setExpandedPlayouts] = useState<Set<number | string>>(new Set());

  const handleToggleWinRate = useCallback(() => {
    setShowWinRate(prev => !prev);
  }, []);

  const handleToggleScoreLead = useCallback(() => {
    setShowScoreLead(prev => !prev);
  }, []);

  /**
   * Generate an alternate playout for a given node by using generateMove repeatedly
   * Stores the moves to display in the panel and returns them
   */
  const generateAlternatePlayout = useCallback(
    async (
      nodeId: number | string,
      moveNumber: number,
      playoutLength: number = 20
    ): Promise<string[] | null> => {
      if (!aiEngine || !isEngineReady) {
        console.warn('AI Engine not ready');
        return null;
      }

      // Mark as generating
      setAlternatePlayouts(prev => {
        const newMap = new Map(prev);
        newMap.set(nodeId, { moves: [], isGenerating: true });
        return newMap;
      });

      try {
        if (!gameTree) {
          console.warn('Game tree not available');
          return null;
        }

        const boardSize = gameInfo.boardSize ?? 19;
        const komi = gameInfo.komi ?? 7.5;

        // Get the path to the node and rebuild the board state
        const pathToNode = getPathToNode(gameTree, nodeId);
        let state = createInitialAnalysisState(boardSize);

        // Apply all moves up to BUT NOT INCLUDING this node (the blunder)
        // This way state.nextToPlay will be the player who made the blunder
        for (let i = 0; i < pathToNode.length - 1; i++) {
          state = updateAnalysisState(state, pathToNode[i] as any, i);
        }

        // Generate playout moves
        const playoutMoves: string[] = [];
        let currentBoard = state.board.clone();
        let currentPlayer = state.nextToPlay;

        for (let i = 0; i < playoutLength; i++) {
          try {
            const moveStr = await aiEngine.generateMove(currentBoard.signMap, {
              komi,
              nextToPlay: currentPlayer,
            });

            playoutMoves.push(`${currentPlayer}:${moveStr}`);

            // Parse the move and apply it to the board
            const vertex = parseGTPCoordinate(moveStr, boardSize);

            if (vertex !== null) {
              // Apply the move to the board
              const sign = currentPlayer === 'B' ? 1 : -1;
              currentBoard = currentBoard.makeMove(sign, vertex, {
                disableKoCheck: false,
                mutate: false,
              });
            }
            // If vertex is null, it's a pass move - don't modify the board

            // Switch player
            currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
          } catch (error) {
            console.error('Error generating move in playout:', error);
            break;
          }
        }

        // Update the playouts map
        setAlternatePlayouts(prev => {
          const newMap = new Map(prev);
          newMap.set(nodeId, { moves: playoutMoves, isGenerating: false });
          return newMap;
        });

        return playoutMoves;
      } catch (error) {
        console.error('Error generating alternate playout:', error);
        // Clear the generating state
        setAlternatePlayouts(prev => {
          const newMap = new Map(prev);
          newMap.delete(nodeId);
          return newMap;
        });
        return null;
      }
    },
    [aiEngine, isEngineReady, gameTree, gameInfo]
  );

  /**
   * Add the alternate playout to the game tree as a new branch
   * This creates a variation starting from the parent of the blunder node
   * Uses addMoveSequence() to avoid navigation and caching side effects
   */
  const addPlayoutToTree = useCallback(
    (nodeId: number | string, playoutMoves?: string[]) => {
      if (!gameTree) {
        console.warn('Game tree not available');
        return;
      }

      // Use provided moves or get from state
      let moves = playoutMoves;
      if (!moves) {
        const playout = alternatePlayouts.get(nodeId);
        if (!playout || playout.isGenerating || playout.moves.length === 0) {
          console.warn('No playout available to add to tree');
          return;
        }
        moves = playout.moves;
      }

      if (moves.length === 0) {
        console.warn('No moves to add');
        return;
      }

      const boardSize = gameInfo.boardSize ?? 19;

      // Find the parent node of the blunder
      const blunderNode = gameTree.get(nodeId);
      if (!blunderNode || blunderNode.parentId === null) {
        console.warn('Cannot find parent node');
        return;
      }

      const parentNodeId = blunderNode.parentId;

      // Convert playout moves to SGF format
      const sgfMoves = moves
        .map(move => {
          const [player, coord] = move.split(':');
          const vertex = parseGTPCoordinate(coord, boardSize);

          if (vertex === null) {
            // Pass move
            return { player: player as 'B' | 'W', coord: '' };
          }

          const [x, y] = vertex;
          // Convert to SGF coordinate (a-s for 19x19)
          const sgfX = String.fromCharCode(97 + x);
          const sgfY = String.fromCharCode(97 + y);
          const sgfCoord = sgfX + sgfY;

          return { player: player as 'B' | 'W', coord: sgfCoord };
        })
        .filter(m => m !== null);

      // Add the move sequence to the tree
      addMoveSequence(parentNodeId, sgfMoves);
    },
    [gameTree, alternatePlayouts, gameInfo, addMoveSequence]
  );

  /**
   * Toggle expansion of a playout display
   */
  const togglePlayoutExpansion = useCallback((nodeId: number | string) => {
    setExpandedPlayouts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  /**
   * Handle click on the playout button - generate playout and add to tree
   */
  const handlePlayoutButtonClick = useCallback(
    async (nodeId: number | string, moveNumber: number) => {
      const playout = alternatePlayouts.get(nodeId);

      // If playout doesn't exist, generate it
      if (!playout) {
        // Start generation
        const moves = await generateAlternatePlayout(nodeId, moveNumber);
        // After generation completes, add to tree with the returned moves
        if (moves && moves.length > 0) {
          addPlayoutToTree(nodeId, moves);
          togglePlayoutExpansion(nodeId);
        }
        return;
      }

      // If already generating, just wait (do nothing)
      if (playout.isGenerating) {
        return;
      }

      // Playout exists and is ready, add to tree
      addPlayoutToTree(nodeId, playout.moves);
      // Optionally expand to show the moves
      togglePlayoutExpansion(nodeId);
    },
    [alternatePlayouts, generateAlternatePlayout, addPlayoutToTree, togglePlayoutExpansion]
  );

  // Build data points from the main line only
  const analysisData = useMemo((): {
    dataPoints: AnalysisDataPoint[];
    totalPositions: number;
    currentPositionIndex: number;
    analyzedCount: number;
    fullPath: Array<{ id: number | string; data: any }>;
  } => {
    if (!gameTree || rootId === null || rootId === undefined || currentNodeId === null) {
      return {
        dataPoints: [],
        totalPositions: 0,
        currentPositionIndex: 0,
        analyzedCount: 0,
        fullPath: [],
      };
    }

    const boardSize = gameInfo.boardSize ?? 19;
    const komi = gameInfo.komi ?? 7.5;

    // Get only the main line nodes (ignoring variations)
    const fullPath: Array<{ id: number | string; data: any }> = [];
    for (const node of gameTree.listMainNodes()) {
      fullPath.push(node);
    }

    // Find the current position index in the main line
    let currentPositionIndex = fullPath.findIndex(node => node.id === currentNodeId);
    // If current node is not on main line, set index to -1
    if (currentPositionIndex === -1) {
      currentPositionIndex = 0;
    }

    if (fullPath.length === 0)
      return {
        dataPoints: [],
        totalPositions: 0,
        currentPositionIndex: 0,
        analyzedCount: 0,
        fullPath: [],
      };

    // First pass: compute all cache keys and collect raw results
    const cacheKeys: string[] = [];
    const rawResults: (import('@kaya/ai-engine').AnalysisResult | null)[] = [];
    let state = createInitialAnalysisState(boardSize);

    for (let i = 0; i < fullPath.length; i++) {
      const pathNode = fullPath[i];
      state = updateAnalysisState(state, pathNode as any, i);

      // Generate cache key for this position
      const cacheKey = generateAnalysisCacheKey(
        state.board.signMap,
        state.nextToPlay,
        komi,
        state.history
      );
      cacheKeys.push(cacheKey);

      // Collect raw result (or null if not cached)
      rawResults.push(analysisCache.current.get(cacheKey) ?? null);
    }

    // Count how many positions have analysis results
    const analyzedCount = rawResults.filter(r => r !== null).length;

    // Second pass: apply smoothing and build data points
    const points: AnalysisDataPoint[] = [];

    for (let i = 0; i < fullPath.length; i++) {
      const result = rawResults[i];
      if (!result) continue;

      // Apply smoothing using previous position only
      const prevResult = i > 0 ? rawResults[i - 1] : null;
      const smoothed = smoothAnalysisResult(result, prevResult);

      points.push({
        moveNumber: i,
        nodeId: fullPath[i].id,
        blackWinRate: smoothed.winRate,
        scoreLead: smoothed.scoreLead,
      });
    }

    return {
      dataPoints: points,
      totalPositions: fullPath.length,
      currentPositionIndex,
      analyzedCount,
      fullPath,
    };
  }, [gameTree, rootId, currentNodeId, gameInfo, analysisCache, analysisCacheSize]);

  const { dataPoints, totalPositions, currentPositionIndex, analyzedCount, fullPath } =
    analysisData;

  // Calculate top 10 moves by point loss
  const topMoveLosses = useMemo(() => {
    if (dataPoints.length < 2 || fullPath.length === 0) return [];

    interface MoveLoss {
      moveNumber: number;
      nodeId: number | string;
      player: 'B' | 'W';
      pointLoss: number;
      scoreBefore: number;
      scoreAfter: number;
    }

    const losses: MoveLoss[] = [];

    for (let i = 1; i < dataPoints.length; i++) {
      const current = dataPoints[i];
      const previous = dataPoints[i - 1];

      // Find the corresponding node in fullPath to determine the player
      const node = fullPath.find(n => n.id === current.nodeId);
      if (!node) continue;

      // Check node data for B (Black) or W (White) move
      const hasBlackMove = node.data.B && Array.isArray(node.data.B) && node.data.B.length > 0;
      const hasWhiteMove = node.data.W && Array.isArray(node.data.W) && node.data.W.length > 0;

      // Skip if no move (root or setup positions)
      if (!hasBlackMove && !hasWhiteMove) continue;

      const player = hasBlackMove ? 'B' : 'W';

      // Calculate point loss for the player who made the move
      // scoreLead is always from Black's perspective (positive = Black ahead)
      // For Black: if scoreLead decreases, Black lost points
      // For White: if scoreLead increases, White lost points (position got worse for White)
      const pointLoss = hasBlackMove
        ? previous.scoreLead - current.scoreLead
        : current.scoreLead - previous.scoreLead;

      // Only include moves where points were actually lost (positive loss)
      if (pointLoss > 0) {
        losses.push({
          moveNumber: current.moveNumber,
          nodeId: current.nodeId,
          player,
          pointLoss,
          scoreBefore: previous.scoreLead,
          scoreAfter: current.scoreLead,
        });
      }
    }

    // Sort by point loss (descending) and take top 10
    return losses.sort((a, b) => b.pointLoss - a.pointLoss).slice(0, 10);
  }, [dataPoints, fullPath]);

  const handleNavigate = useCallback(
    (nodeId: number | string) => {
      navigate(nodeId);
    },
    [navigate]
  );

  const handleNavigateToMove = useCallback(
    (targetMoveNumber: number) => {
      navigateToMove(targetMoveNumber);
    },
    [navigateToMove]
  );

  const isFullyAnalyzed = totalPositions > 0 && dataPoints.length === totalPositions;

  return (
    <div className={`analysis-graph-panel ${className}`}>
      {/* Single unified toolbar */}
      <div className="analysis-panel-toolbar">
        {/* Analysis Mode Toggle */}
        <button
          className={`analysis-mode-indicator ${analysisMode ? 'active' : ''}`}
          onClick={toggleAnalysisMode}
          title={analysisMode ? t('analysis.analysisModeOn') : t('analysis.analysisModeOff')}
          aria-label={analysisMode ? t('analysis.analysisModeOn') : t('analysis.analysisModeOff')}
        >
          <span className="analysis-mode-dot" />
          <LuBrain size={14} />
        </button>

        <div className="analysis-toolbar-separator" />

        {/* Board overlay toggles */}
        <button
          className={`analysis-overlay-button ${showOwnership ? 'active' : ''}`}
          onClick={toggleOwnership}
          disabled={isInitializing}
          title={t('analysis.toggleOwnership')}
          aria-label={t('analysis.toggleOwnership')}
          aria-pressed={showOwnership}
        >
          <LuMap size={14} />
        </button>
        <button
          className={`analysis-overlay-button ${showTopMoves ? 'active' : ''}`}
          onClick={toggleTopMoves}
          disabled={isInitializing}
          title={t('analysis.toggleTopMoves')}
          aria-label={t('analysis.toggleTopMoves')}
          aria-pressed={showTopMoves}
        >
          <LuLayers size={14} />
        </button>

        <div className="analysis-toolbar-separator" />

        {/* Action buttons */}
        <button
          className={`analysis-action-button ${isFullGameAnalyzing ? 'active analyzing' : ''}`}
          title={
            isFullGameAnalyzing
              ? t('analysis.stopAnalysis')
              : pendingFullGameAnalysis
                ? t('analysis.waitingForEngine')
                : t('analysis.analyzeFullGame')
          }
          onClick={isFullGameAnalyzing ? stopFullGameAnalysis : analyzeFullGame}
          disabled={isInitializing || isStopping || pendingFullGameAnalysis || isFullyAnalyzed}
          aria-label={t('analysis.analyzeFullGame')}
        >
          {isFullGameAnalyzing ? <LuSquare size={14} /> : <LuZap size={14} />}
        </button>
        <button
          className="analysis-action-button"
          title={
            analysisCacheSize > 0
              ? t('analysis.clearCacheWithCount', { count: analysisCacheSize })
              : t('analysis.noCachedAnalysis')
          }
          onClick={clearAnalysisCache}
          disabled={analysisCacheSize === 0 || isFullGameAnalyzing}
          aria-label={t('analysis.clearCache')}
        >
          <LuTrash2 size={14} />
        </button>
        <button
          className="analysis-action-button"
          title={t('analysis.analysisLegend')}
          onClick={() => setShowMoveStrengthInfo(true)}
          aria-label={t('analysis.analysisLegend')}
        >
          <LuInfo size={14} />
        </button>

        <div className="analysis-toolbar-separator" />

        {/* Position count */}
        <span
          className="analysis-positions-count"
          title={t('analysis.positionsAnalyzed', {
            analyzed: analyzedCount,
            total: totalPositions,
          })}
        >
          {analyzedCount}/{totalPositions}
        </span>
      </div>

      {/* Chart legend row - Win Rate / Score toggles */}
      <div className="analysis-chart-legend">
        <button
          className={`analysis-legend-toggle ${showWinRate ? 'active' : ''}`}
          onClick={handleToggleWinRate}
          title={t('analysis.toggleWinRate')}
          aria-label={t('analysis.toggleWinRate')}
          aria-pressed={showWinRate}
        >
          <span className="legend-indicator legend-winrate" />
          <span className="legend-label">{t('analysis.winRate')}</span>
        </button>
        <button
          className={`analysis-legend-toggle ${showScoreLead ? 'active' : ''}`}
          onClick={handleToggleScoreLead}
          title={t('analysis.toggleScore')}
          aria-label={t('analysis.toggleScore')}
          aria-pressed={showScoreLead}
        >
          <span className="legend-indicator legend-score" />
          <span className="legend-label">{t('analysis.score')}</span>
        </button>
        <button
          className={`analysis-legend-toggle ${showMoveLossTable ? 'active' : ''}`}
          onClick={() => setShowMoveLossTable(prev => !prev)}
          title="Show top moves by point loss"
          aria-label="Toggle move loss table"
          aria-pressed={showMoveLossTable}
          disabled={topMoveLosses.length === 0}
        >
          <span className="legend-label">Top Losses</span>
        </button>
      </div>

      {(isInitializing || isAnalyzing) && (
        <div className="analysis-status-bar">
          <LuLoader className="analysis-spinner" />
          <span>{isInitializing ? t('analysis.initializingEngine') : t('analysis.analyzing')}</span>
        </div>
      )}

      {/* Progress bar shown above chart during analysis */}
      {isFullGameAnalyzing && (
        <div className="analysis-progress-inline">
          <span className="analysis-progress-label">
            {isStopping
              ? t('analysis.stopping')
              : t('analysis.analyzingProgress', { progress: Math.round(fullGameProgress) })}
          </span>
          <div className="analysis-progress-bar-inline">
            <div className="analysis-progress-bar" style={{ width: `${fullGameProgress}%` }} />
          </div>
          <button
            className="analysis-stop-button-small"
            onClick={stopFullGameAnalysis}
            disabled={isStopping}
            title={t('analysis.stopAnalysisButton')}
          >
            ✕
          </button>
        </div>
      )}

      {/* Always show the chart - allows clicking to navigate even without analysis */}
      <AnalysisChart
        data={dataPoints}
        currentMoveNumber={currentPositionIndex}
        totalMoves={totalPositions > 0 ? totalPositions - 1 : 0}
        onNavigate={handleNavigate}
        onNavigateToMove={handleNavigateToMove}
        showWinRate={showWinRate}
        showScoreLead={showScoreLead}
        onToggleWinRate={handleToggleWinRate}
        onToggleScoreLead={handleToggleScoreLead}
      />

      {/* Move loss table */}
      {showMoveLossTable && topMoveLosses.length > 0 && (
        <div className="move-loss-table-container">
          <table className="move-loss-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Move</th>
                <th>Player</th>
                <th>Point Loss</th>
                <th>Score Before</th>
                <th>Score After</th>
                <th>Alt. Playout</th>
              </tr>
            </thead>
            <tbody>
              {topMoveLosses.map((loss, index) => {
                const playout = alternatePlayouts.get(loss.nodeId);
                const isExpanded = expandedPlayouts.has(loss.nodeId);
                return (
                  <React.Fragment key={loss.nodeId}>
                    <tr className="move-loss-row">
                      <td onClick={() => handleNavigate(loss.nodeId)}>{index + 1}</td>
                      <td onClick={() => handleNavigate(loss.nodeId)}>{loss.moveNumber}</td>
                      <td onClick={() => handleNavigate(loss.nodeId)}>
                        <span className={`player-indicator player-${loss.player.toLowerCase()}`}>
                          {loss.player}
                        </span>
                      </td>
                      <td onClick={() => handleNavigate(loss.nodeId)} className="point-loss-value">
                        {loss.pointLoss.toFixed(1)}
                      </td>
                      <td onClick={() => handleNavigate(loss.nodeId)}>
                        {loss.scoreBefore > 0 ? '+' : ''}
                        {loss.scoreBefore.toFixed(1)}
                      </td>
                      <td onClick={() => handleNavigate(loss.nodeId)}>
                        {loss.scoreAfter > 0 ? '+' : ''}
                        {loss.scoreAfter.toFixed(1)}
                      </td>
                      <td>
                        <button
                          className="playout-toggle-button"
                          onClick={e => {
                            e.stopPropagation();
                            handlePlayoutButtonClick(loss.nodeId, loss.moveNumber);
                          }}
                          disabled={playout?.isGenerating}
                          title={
                            playout?.isGenerating
                              ? 'Generating playout...'
                              : 'Generate and add alternate playout to game tree'
                          }
                        >
                          {playout?.isGenerating ? (
                            <LuLoader className="spinner" size={14} />
                          ) : (
                            <LuPlay size={14} />
                          )}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && playout && !playout.isGenerating && (
                      <tr className="playout-detail-row">
                        <td colSpan={7}>
                          <div className="playout-moves">
                            <strong>Alternate playout:</strong>
                            <div className="playout-moves-list">
                              {playout.moves.map((move, idx) => {
                                const [player, coord] = move.split(':');
                                return (
                                  <span key={idx} className="playout-move">
                                    <span
                                      className={`player-indicator player-${player.toLowerCase()}`}
                                    >
                                      {player}
                                    </span>
                                    {coord}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AnalysisLegendModal
        isOpen={showMoveStrengthInfo}
        onClose={() => setShowMoveStrengthInfo(false)}
      />
    </div>
  );
};
